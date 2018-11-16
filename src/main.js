const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const {
  config,
  Wechaty,
  log,
  Message,
} = require('./wechaty/index')
// const blessed = require('blessed')
// const contrib = require('blessed-contrib')
// const generate = require('qrcode-terminal')
const qrcodeTerminal  = require('qrcode-terminal')
const Tuling123       = require('tuling123-client')


let bot
// const { PuppetPuppeteer } = require('../../dist/src/')
// let window
app.on('ready', () => {
  // window = new BrowserWindow();
  // window.loadURL(url.format({
  //   pathname: path.join(__dirname, './index.html'),
  //   protocol: 'file',
  //   slashes: true
  // }))
  // window.webContents.openDevTools()
  // ipcMain.on("startWechaty", () => {
  initbot()
  // })
})
app.on('window-all-closed', () => {
  app.quit()
})

function initbot() {
  bot = new Wechaty({
    browerOption:{
      title:'微信',
      show: false,
      width: 380,
      height: 500,
      frame: true,
      autoHideMenuBar: true,
      resizable: false,

      icon: path.join(__dirname, '/icon/icon.png'),
    }
  })

  const welcome = `
=============== Powered by Wechaty ===============
-------- https://github.com/Chatie/wechaty --------

I can talk with you using Tuling123.com
Apply your own tuling123.com API_KEY
at: http://www.tuling123.com/html/doc/api.html

__________________________________________________

Please wait... I'm trying to login in...
`

  console.log(welcome)

  /**
   *
   * Apply Your Own Tuling123 Developer API_KEY at:
   * http://www.tuling123.com
   *
   */
  const TULING123_API_KEY = '3dd88d01b4f24d3fa6bb43b3f222d6c1'
  const tuling = new Tuling123(TULING123_API_KEY)

  let busyIndicator    = false
  let tulingRun    = false
  let busyAnnouncement = `自动回复: 这是一条自动回复消息，本人暂时忙碌中，稍后回复你的消息！`


  bot.on('login',   onLogin)
  bot.on('logout',  onLogout)
  bot.on('scan',    onScan)
  bot.on('message', onMessage)
  bot.on('error',   onError)
  /**
   *
   * Wechaty Event: `friend`
   *
   */
  bot.on('friendship', async friendship => {
    let logMsg
    const fileHelper = bot.Contact.load('filehelper')

    try {
      logMsg = 'received `friend` event from ' + friendship.contact().name()
      await fileHelper.say(logMsg)
      console.log(logMsg)

      switch (friendship.type()) {
        /**
         *
         * 1. New Friend Request
         *
         * when request is set, we can get verify message from `request.hello`,
         * and accept this request by `request.accept()`
         */
        case Friendship.Type.Receive:
          if (friendship.hello() === 'ding') {
            logMsg = 'accepted automatically because verify messsage is "ding"'
            console.log('before accept')
            await friendship.accept()

            // if want to send msg , you need to delay sometimes
            await new Promise(r => setTimeout(r, 1000))
            await friendship.contact().say('hello from Wechaty')
            console.log('after accept')

          } else {
            logMsg = 'not auto accepted, because verify message is: ' + friendship.hello()
          }
          break

        /**
         *
         * 2. Friend Ship Confirmed
         *
         */
        case Friendship.Type.Confirm:
          logMsg = 'friend ship confirmed with ' + friendship.contact().name()
          break
      }
    } catch (e) {
      logMsg = e.message
    }

    console.log(logMsg)
    await fileHelper.say(logMsg)
    })
  bot.start()
    .catch(console.error)

  function onScan (qrcode, status) {
    // Generate a QR Code online via
    // http://goqr.me/api/doc/create-qr-code/
    qrcodeTerminal.generate(qrcode, { small: true })
    const qrcodeImageUrl = [
      'https://api.qrserver.com/v1/create-qr-code/?data=',
      encodeURIComponent(qrcode),
    ].join('')

    console.log(`[${status}] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
  }

  function onLogin (contactId) {
    console.log(`${contactId} login`)
    bot.say('登录成功！').catch(console.error)
  }

  function onLogout (contactId) {
    console.log(`${contactId} logouted`)
  }

  function onError (e) {
    console.error('Bot error:', e)
    /*
    if (bot.logonoff()) {
      bot.say('Wechaty error: ' + e.message).catch(console.error)
    }
    */
  }

  async function onMessage (msg) {
    // console.log('123')
    // console.log(msg.self())
    const filehelper = bot.Contact.load('filehelper')

    const sender = msg.from()
    const receiver = msg.to()
    const text = msg.text()
    const room = msg.room()
    console.log('消息主体：'+msg.toString())

    if (receiver.id === 'filehelper') {
      if (text === '#status') {
        await filehelper.say('in busy mode: ' + busyIndicator)
        await filehelper.say('auto reply: ' + busyAnnouncement)

      } else if (text === '#free') {
        busyIndicator = false
        await filehelper.say('自动回复关闭！')

      } else if (/^#busy/i.test(text)) {

        busyIndicator = true
        await filehelper.say('自动回复启用！')

        const matches = text.match(/^#busy (.+)$/i)
        if (!matches || !matches[1]) {
          await filehelper.say('自动回复消息: "' + busyAnnouncement + '"')

        } else {
          busyAnnouncement = matches[1]
          await filehelper.say('设置自动回复消息为: "' + busyAnnouncement + '"')

        }
      } else if (text === '#run') {
        tulingRun = true
        await filehelper.say('机器人启动！')
      } else if (text === '#stop') {
        tulingRun = false
        await filehelper.say('机器人关闭！')
      }

      return
    }
    if (sender.type() !== bot.Contact.Type.Personal) {
      return
    }
    if (msg.type() !== Message.Type.Text) {
      const file = await msg.toFileBox()
      const name = file.name
      file.toFile('savefile/'+name)
      // console.log('===============保存文件成功:'+name+'===============')
    }
    // Skip message from self, or inside a room
    if (msg.self() || room || sender.name() === '微信团队' || msg.type() !== Message.Type.Text) return

    if (busyIndicator) {
      /**
       * 1. Send busy anoncement to contact
       */
      if (!room) {
        await msg.say(busyAnnouncement)
        return
      }

      /**
       * 2. If there's someone mentioned me in a room,
       *  then send busy annoncement to room and mention the contact who mentioned me.
       */
      const contactList = await msg.mention()
      const contactIdList = contactList.map(c => c.id)
      if (contactIdList.includes(this.userSelf().id)) {
        await msg.say(busyAnnouncement, sender)
      }
    }
    if (tulingRun) {
      console.log('Bot', 'talk: %s', msg.text())
      try {
        const {text: reply} = await tuling.ask(msg.text(), {userid: msg.from()})
        console.log('Tuling123', 'Talker reply:"%s" for "%s" ',
          reply,
          msg.text(),
        )
        await msg.say(reply)
      } catch (e) {
        console.error('Bot', 'on message tuling.ask() exception: %s', e && e.message || e)
      }
    }
  }
}



/**
 * Wechaty Twins Bot + Blessed Contrib Demo
 * Credit: https://github.com/yaronn/blessed-contrib/blob/06a05f107a3b54c91b5200a041ad8c15e6489de9/examples/dashboard.js
 */
// import {blessed }from 'blessed'
// import contrib from 'blessed-contrib'
//
// import { generate } from 'qrcode-terminal'

// import {
//   Wechaty,
// }               from 'wechaty'

// setInterval(() => {
//   boyConsole.log('boy')
//   girlConsole.log('girl')
//   console.log('zixia')
// }, 500)

/**
 *
 *
 *
 * Wechaty multi instance support example:
 * boy & girl twins
 *
 *
 *
 */
// function initbot() {
//
//   const screen = blessed.screen({
//     smartCSR:     true,
//     fullUnicode:  true,  // https://github.com/chjj/blessed/issues/226#issuecomment-188777457
//   })
//
// // create layout and widgets
//
//   const grid = new contrib.grid({rows: 12, cols: 12, screen: screen})
//
//   /**
//    * Donut Options
//    *   self.options.radius = options.radius || 14; // how wide is it? over 5 is best
//    *   self.options.arcWidth = options.arcWidth || 4; //width of the donut
//    *   self.options.yPadding = options.yPadding || 2; //padding from the top
//    */
//   const donut = grid.set(8, 8, 4, 2, contrib.donut,
//     {
//       label: 'Percent Donut',
//       radius: 16,
//       arcWidth: 4,
//       yPadding: 2,
//       data: [{label: 'Storage', percent: 87}],
//     })
//
// // const latencyLine = grid.set(8, 8, 4, 2, contrib.line,
// //   { style:
// //     { line: "yellow"
// //     , text: "green"
// //     , baseline: "black"}
// //   , xLabelPadding: 3
// //   , xPadding: 5
// //   , label: 'Network Latency (sec)'})
//
//   const gauge = grid.set(8, 10, 2, 2, contrib.gauge, {label: 'Storage', percent: [80, 20]})
//   const gaugeTwo = grid.set(2, 9, 2, 3, contrib.gauge, {label: 'Deployment Progress', percent: 80})
//
//   const sparkline = grid.set(10, 10, 2, 2, contrib.sparkline,
//     { label: 'Throughput (bits/sec)'
//       , tags: true
//       , style: { fg: 'blue', titleFg: 'white' }})
//
//   const bar = grid.set(4, 6, 4, 3, contrib.bar,
//     { label: 'Server Utilization (%)'
//       , barWidth: 4
//       , barSpacing: 6
//       , xOffset: 2
//       , maxHeight: 9})
//
//   const table =  grid.set(4, 9, 4, 3, contrib.table,
//     { keys: true
//       , fg: 'green'
//       , label: 'Active Processes'
//       , columnSpacing: 1
//       , columnWidth: [24, 10, 10]})
//
//   /*
//    *
//    * LCD Options
//   //these options need to be modified epending on the resulting positioning/size
//     options.segmentWidth = options.segmentWidth || 0.06; // how wide are the segments in % so 50% = 0.5
//     options.segmentInterval = options.segmentInterval || 0.11; // spacing between the segments in % so 50% = 0.5
//     options.strokeWidth = options.strokeWidth || 0.11; // spacing between the segments in % so 50% = 0.5
//   //default display settings
//     options.elements = options.elements || 3; // how many elements in the display. or how many characters can be displayed.
//     options.display = options.display || 321; // what should be displayed before anything is set
//     options.elementSpacing = options.spacing || 4; // spacing between each element
//     options.elementPadding = options.padding || 2; // how far away from the edges to put the elements
//   //coloring
//     options.color = options.color || "white";
//   */
//   const lcdLineOne = grid.set(0, 9, 2, 3, contrib.lcd,
//     {
//       label: 'LCD Test',
//       segmentWidth: 0.06,
//       segmentInterval: 0.11,
//       strokeWidth: 0.1,
//       elements: 5,
//       display: 3210,
//       elementSpacing: 4,
//       elementPadding: 2,
//     },
//   )
//
//   const errorsLine = grid.set(0, 6, 4, 3, contrib.line, {
//     style: {
//       line: 'red',
//       text: 'white',
//       baseline: 'black',
//     },
//     label: 'Errors Rate',
//     maxY: 60,
//     showLegend: true,
//   })
//
//   const boyConsole = grid.set(0, 0, 12, 6, contrib.log, {
//     fg: 'green',
//     selectedFg: 'green',
//     label: 'Boy Bot',
//   })
//
//   // const girlConsole = grid.set(6, 0, 6, 6, contrib.log, {
//   //   fg: 'red',
//   //   selectedFg: 'red',
//   //   label: 'Girl Bot',
//   // })
//
//   const logBug = grid.set(8, 6, 4, 2, contrib.log, {
//     fg: 'green',
//     selectedFg: 'green',
//     label: 'Server Log',
//   })
//
// // dummy data
//   const servers = ['US1', 'US2', 'EU1', 'AU1', 'AS1', 'JP1']
//   const commands = ['grep', 'node', 'java', 'timer', '~/ls -l', 'netns', 'watchdog', 'gulp', 'tar -xvf', 'awk', 'npm install']
//
// // set dummy data on gauge
//   let gaugePercent = 0
//   setInterval(function() {
//     gauge.setData([gaugePercent, 100 - gaugePercent])
//     gaugePercent++
//     if (gaugePercent >= 100) gaugePercent = 0
//   }, 200)
//
//   let gaugePercentTwo = 0
//   setInterval(function() {
//     gaugeTwo.setData(gaugePercentTwo)
//     gaugePercentTwo++
//     if (gaugePercentTwo >= 100) gaugePercentTwo = 0
//   }, 200)
//
// // set dummy data on bar chart
//   function fillBar() {
//     const arr = []
//     for (let i = 0; i < servers.length; i++) {
//       arr.push(Math.round(Math.random() * 10))
//     }
//     bar.setData({titles: servers, data: arr})
//   }
//   fillBar()
//   setInterval(fillBar, 2000)
//
// // set dummy data for table
//   function generateTable() {
//     const data = []
//
//     for (let i = 0; i < 30; i++) {
//       const row  = []
//       row.push(commands[Math.round(Math.random() * (commands.length - 1))])
//       row.push(Math.round(Math.random() * 5))
//       row.push(Math.round(Math.random() * 100))
//
//       data.push(row)
//     }
//     const headers = ['Process', 'Cpu (%)', 'Memory']
//     table.setData({headers, data})
//   }
//
//   generateTable()
//   table.focus()
//   setInterval(generateTable, 3000)
//
// // set log dummy data
//   setInterval(function() {
//     const rnd = Math.round(Math.random() * 2)
//     if (rnd === 0) logBug.log('starting process ' + commands[Math.round(Math.random() * (commands.length - 1))])
//     else if (rnd === 1) logBug.log('terminating server ' + servers[Math.round(Math.random() * (servers.length - 1))])
//     else if (rnd === 2) logBug.log('avg. wait time ' + Math.random().toFixed(2))
//     screen.render()
//   }, 500)
//
// // set spark dummy data
//   const spark1 = [1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5, 4, 4, 5, 4, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5]
//   const spark2 = [4, 4, 5, 4, 1, 5, 1, 2, 5, 2, 1, 5, 4, 4, 5, 4, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5]
//
//   refreshSpark()
//   setInterval(refreshSpark, 1000)
//
//   function refreshSpark() {
//     spark1.shift()
//     spark1.push(Math.random() * 5 + 1)
//     spark2.shift()
//     spark2.push(Math.random() * 5 + 1)
//     sparkline.setData(['Server1', 'Server2'], [spark1, spark2])
//   }
//
// // set line charts dummy data
//
//   const errorsData = {
//     title: 'server 1',
//     x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:25'],
//     y: [30, 50, 70, 40, 50, 20],
//   }
//
// // const latencyData = {
// //    x: ['t1', 't2', 't3', 't4'],
// //    y: [5, 1, 7, 5],
// // }
//
//   setLineData([errorsData], errorsLine)
// // setLineData([latencyData], latencyLine)
//
//   setInterval(function() {
//     setLineData([errorsData], errorsLine)
//   }, 1500)
//
//   setInterval(function() {
//     const colors = ['green', 'magenta', 'cyan', 'red', 'blue']
//     const text = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
//
//     const value = Math.round(Math.random() * 100)
//     lcdLineOne.setDisplay(value + text[value % 12])
//     lcdLineOne.setOptions({
//       color: colors[value % 5],
//       elementPadding: 4,
//     })
//     screen.render()
//   }, 1500)
//
//   let pct = 0.00
//
//   function updateDonut() {
//     if (pct > 0.99) pct = 0.00
//     let color = 'green'
//     if (pct >= 0.25) color = 'cyan'
//     if (pct >= 0.5) color = 'yellow'
//     if (pct >= 0.75) color = 'red'
//     donut.setData([
//       {percent: parseFloat((pct + 0.00) % 1).toFixed(2), label: 'storage', 'color': color},
//     ])
//     pct += 0.01
//   }
//
//   setInterval(function() {
//     updateDonut()
//     screen.render()
//   }, 500)
//
//   function setLineData(mockData, line) {
//     for (let i = 0; i < mockData.length; i++) {
//       const last = mockData[i].y[mockData[i].y.length - 1]
//       mockData[i].y.shift()
//       const num = Math.max(last + Math.round(Math.random() * 10) - 5, 10)
//       mockData[i].y.push(num)
//     }
//
//     line.setData(mockData)
//   }
//
//   screen.key(['escape', 'q', 'C-c'], function(ch, key) {
//     console.log(ch, key)
//     return process.exit(0)
//   })
//
// // fixes https://github.com/yaronn/blessed-contrib/issues/10
//   screen.on('resize', function() {
//     donut.emit('attach')
//     gauge.emit('attach')
//     gaugeTwo.emit('attach')
//     sparkline.emit('attach')
//     bar.emit('attach')
//     table.emit('attach')
//     lcdLineOne.emit('attach')
//     errorsLine.emit('attach')
//     boyConsole.emit('attach')
//     // girlConsole.emit('attach')
//     logBug.emit('attach')
//   })
//
//   screen.render()
//
//
//   const boy = new Wechaty({
//     browerOption:{
//       title:'微信',
//       width: 1000,
//       height: 700,
//       minWidth: 720,
//       minHeight: 450,
//       show: false,
//       icon: path.join(__dirname, '/icon/icon.png'),
//     }
//   })
//   // const girl = new Wechaty()
//
//   startBot(boy, boyConsole)
//   // startBot(girl, girlConsole)
//
//   function startBot(bot, logElement) {
//
//     const TULING123_API_KEY = '3dd88d01b4f24d3fa6bb43b3f222d6c1'
//     const tuling = new Tuling123(TULING123_API_KEY)
//
//     let busyIndicator    = false
//     let tulingRun    = false
//     let busyAnnouncement = `自动回复: 这是一条自动回复消息，本人暂时忙碌中，稍后回复你的消息！`
//
//
//     // logElement.log('Initing...')
//     bot
//       .on('logout', user => logElement.log(`${user.name()} logouted`))
//       .on('login', user => {
//         logElement.setContent('')
//         logElement.log(`${user.name()} login`)
//         bot.say('Wechaty login').catch(console.error)
//         logElement.setLabel(logElement._label.content + ' - ' + user.name())
//       })
//       .on('scan', (qrcode) => {
//         qrcodeTerminal.generate(
//           qrcode,
//           {
//             small: true,
//           },
//           (asciiart) => logElement.setContent(asciiart),
//         )
//       })
//       .on('message', onMessage)
//
//     bot.start()
//       .catch(async e => {
//         logElement.log(`start() fail: ${e}`)
//         await bot.stop()
//         process.exit(-1)
//       })
//
//     bot.on('error', async e => {
//       logElement.error(`error: ${e}`)
//       if (bot.logonoff()) {
//         await bot.say('Wechaty error: ' + e.message).catch(console.error)
//       }
//       // await bot.stop()
//     })
//
//
//     async function onMessage (msg) {
//       // console.log('123')
//       // console.log(msg.self())
//       const filehelper = bot.Contact.load('filehelper')
//
//       const sender = msg.from()
//       const receiver = msg.to()
//       const text = msg.text()
//       const room = msg.room()
//       logElement.log('消息主体：'+msg.toString())
//
//       if (receiver.id === 'filehelper') {
//         if (text === '#status') {
//           await filehelper.say('in busy mode: ' + busyIndicator)
//           await filehelper.say('auto reply: ' + busyAnnouncement)
//
//         } else if (text === '#free') {
//           busyIndicator = false
//           await filehelper.say('自动回复关闭！')
//
//         } else if (/^#busy/i.test(text)) {
//
//           busyIndicator = true
//           await filehelper.say('自动回复启用！')
//
//           const matches = text.match(/^#busy (.+)$/i)
//           if (!matches || !matches[1]) {
//             await filehelper.say('自动回复消息: "' + busyAnnouncement + '"')
//
//           } else {
//             busyAnnouncement = matches[1]
//             await filehelper.say('设置自动回复消息为: "' + busyAnnouncement + '"')
//
//           }
//         } else if (text === '#run') {
//           tulingRun = true
//           await filehelper.say('机器人启动！')
//         } else if (text === '#stop') {
//           tulingRun = false
//           await filehelper.say('机器人关闭！')
//         }
//
//         return
//       }
//       if (sender.type() !== bot.Contact.Type.Personal) {
//         return
//       }
//
//       // Skip message from self, or inside a room
//       if (msg.self() || room || sender.name() === '微信团队' || msg.type() !== Message.Type.Text) return
//
//       if (busyIndicator) {
//         /**
//          * 1. Send busy anoncement to contact
//          */
//         if (!room) {
//           await msg.say(busyAnnouncement)
//           return
//         }
//
//         /**
//          * 2. If there's someone mentioned me in a room,
//          *  then send busy annoncement to room and mention the contact who mentioned me.
//          */
//         const contactList = await msg.mention()
//         const contactIdList = contactList.map(c => c.id)
//         if (contactIdList.includes(this.userSelf().id)) {
//           await msg.say(busyAnnouncement, sender)
//         }
//       }
//       if (tulingRun) {
//         logElement.log('Bot', 'talk: %s', msg.text())
//         try {
//           const {text: reply} = await tuling.ask(msg.text(), {userid: msg.from()})
//           logElement.log('Tuling123', 'Talker reply:"%s" for "%s" ',
//             reply,
//             msg.text(),
//           )
//           await msg.say(reply)
//         } catch (e) {
//           logElement.error('Bot', 'on message tuling.ask() exception: %s', e && e.message || e)
//         }
//       }
//     }
//   }
//
//
//   // const boy = new Wechaty()
//   // const girl = new Wechaty()
//   //
//   // startBot(boy, boyConsole)
//   // startBot(girl, girlConsole)
//   //
//   // function startBot(bot, logElement) {
//   //   // logElement.log('Initing...')
//   //   bot
//   //     .on('logout', user => logElement.log(`${user.name()} logouted`))
//   //     .on('login', user => {
//   //       logElement.setContent('')
//   //       logElement.log(`${user.name()} login`)
//   //       bot.say('Wechaty login').catch(console.error)
//   //       logElement.setLabel(logElement._label.content + ' - ' + user.name())
//   //     })
//   //     .on('scan', (qrcode) => {
//   //       qrcodeTerminal.generate(
//   //         qrcode,
//   //         {
//   //           small: true,
//   //         },
//   //         (asciiart) => logElement.setContent(asciiart),
//   //       )
//   //     })
//   //     .on('message', async m => {
//   //       logElement.log(m.toString())
//   //     })
//   //
//   //   bot.start()
//   //     .catch(async e => {
//   //       logElement.log(`start() fail: ${e}`)
//   //       await bot.stop()
//   //       process.exit(-1)
//   //     })
//   //
//   //   bot.on('error', async e => {
//   //     logElement.log(`error: ${e}`)
//   //     if (bot.logonoff()) {
//   //       await bot.say('Wechaty error: ' + e.message).catch(console.error)
//   //     }
//   //     // await bot.stop()
//   //   })
//   // }
// }
