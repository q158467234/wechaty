const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const {
  config,
  Wechaty,
  log,
  Message,
} = require('./wechaty/index')
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

// function initbot () {
//   console.log('1次')
//   puppet = new Wechaty()
//   /**
//    *
//    * 2. Register event handlers for Bot
//    *
//    */
//   puppet
//     .on('logout', onLogout)
//     .on('login',  onLogin)
//     .on('scan',   onScan)
//     .on('error',  onError)
//     .on('message', onMessage)
//
//   /**
//    *
//    * 3. Start the bot!
//    *
//    */
//   puppet.start()
//     .catch(async e => {
//       console.error('Bot start() fail:', e)
//       await puppet.stop()
//       process.exit(-1)
//     })
//
//   /**
//    *
//    * 4. You are all set. ;-]
//    *
//    */
//
//   /**
//    *
//    * 5. Define Event Handler Functions for:
//    *  `scan`, `login`, `logout`, `error`, and `message`
//    *
//    */
//   function onScan (qrcode, status) {
//     // Generate a QR Code online via
//     // http://goqr.me/api/doc/create-qr-code/
//     const qrcodeImageUrl = [
//       'https://api.qrserver.com/v1/create-qr-code/?data=',
//       encodeURIComponent(qrcode),
//     ].join('')
//
//     console.log(`[${status}] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
//   }
//
//   function onLogin (contactId) {
//     console.log(`${contactId} login`)
//     puppet.messageSendText({ contactId, }, 'Wechaty login').catch(console.error)
//   }
//
//   function onLogout (contactId) {
//     console.log(`${contactId} logouted`)
//   }
//
//   function onError (e) {
//     console.error('Bot error:', e)
//     /*
//     if (bot.logonoff()) {
//       bot.say('Wechaty error: ' + e.message).catch(console.error)
//     }
//     */
//   }
//
//   /**
//    *
//    * 6. The most important handler is for:
//    *    dealing with Messages.
//    *
//    */
//   async function onMessage (msg) {
//     console.log(msg)
//     console.log('room'+msg.room())
//     console.log('调用一次')
//     // const payload = await puppet.messagePayload(messageId)
//     // console.log(JSON.stringify(payload))
//   }
//
// //   /**
// //    *
// //    * 7. Output the Welcome Message
// //    *
// //    */
// //   const welcome = `
// // Puppet Version: ${puppet.version()}
// //
// // Please wait... I'm trying to login in...
// //
// // `
// //   console.log(welcome)
//
//   // const bot = Wechaty.instance({ profile: config.default.DEFAULT_PROFILE })
//   //
//   // bot
//   //   .on('logout', user => log.info('Bot', `${user.name()} logouted`))
//   //   .on('login', user => {
//   //     log.info('Bot', `${user.name()} login`)
//   //     bot.say('Wechaty login').catch(console.error)
//   //   })
//   //   .on('scan', (url, code) => {
//   //     if (!/201|200/.test(String(code))) {
//   //       const loginUrl = url.replace(/\/qrcode\//, '/l/')
//   //         // QrcodeTerminal.generate(loginUrl)
//   //     }
//   //     console.log(`${url}\n[${code}] Scan QR Code above url to log in: `)
//   //   })
//   //   .on('message', async m => {
//   //     try {
//   //       const room = m.room()
//   //       console.log(
//   //         (room ? `${room}` : '') +
//   //         `${m.from()}:${m}`,
//   //       )
//   //       if (/^(ding|ping|bing|code)$/i.test(m.content()) && !m.self()) {
//   //         m.say('dong')
//   //         log.info('Bot', 'REPLY: dong')
//   //
//   //         const joinWechaty = `Join Wechaty Developers' Community\n\n` +
//   //           `Wechaty is used in many ChatBot projects by hundreds of developers.\n\n` +
//   //           `If you want to talk with other developers, just scan the following QR Code in WeChat with secret code: wechaty,\n\n` +
//   //           `you can join our Wechaty Developers' Home at once`
//   //         await m.say(joinWechaty)
//   //         await m.say('Scan now, because other Wechaty developers want to talk with you too!\n\n(secret code: wechaty)')
//   //         log.info('Bot', 'REPLY: Image')
//   //       }
//   //     } catch (e) {
//   //       log.error('Bot', 'on(message) exception: %s', e)
//   //     }
//   //   })
//   //
//   // bot.start()
//   //   .catch(e => {
//   //     log.error('Bot', 'start() fail: %s', e)
//   //     bot.stop()
//   //     process.exit(-1)
//   //   })
//   //
//   // bot.on('error', async e => {
//   //   log.error('Bot', 'error: %s', e)
//   //   if (bot.logonoff()) {
//   //     await bot.say('Wechaty error: ' + e.message).catch(console.error)
//   //   }
//   //   // await bot.stop()
//   // })
// }
//
function initbot() {
  console.log('main路径1:'+__dirname)
  console.log('main路径2:'+path.resolve(__dirname,'..'))
  bot = new Wechaty({
    browerOption:{
      title:'微信',
      width: 1000,
      height: 700,
      minWidth: 720,
      minHeight: 450,
      show: false,
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
    // puppet.messageSendText({ contactId, }, 'Wechaty login').catch(console.error)
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
