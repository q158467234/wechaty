import { app, BrowserWindow, WebContents, Cookie, ipcMain, Tray, Menu,session } from 'electron'
// @ts-ignore
import  * as _  from 'lodash'
import { setTimeout } from 'timers'
import path from 'path'
// @ts-ignore
import  CssInjector from './css-injector'
export class Browser {
  public options: any
  // @ts-ignore
  constructor (options) {
    this.options = options
  }
  public async close (): Promise<any> {
    // @ts-ignore
    return new Promise((resolve, reject) => {
      resolve()
    })
  }
  public async version (): Promise<string> {
    // @ts-ignore
    return new Promise<string>((resolve, reject) => {
      return  resolve('version')
    })
  }

  public async newPage (): Promise<Page> {
    // @ts-ignore
    return new Promise<Page>((resolve, reject) => {
      return resolve(new Page(this.options))
    })
  }
}
export class Dialog {
  // @ts-ignore
  public type: string
  public message (): string {
    return 'message'
  }
  public async accept (): Promise<any> {
    // @ts-ignore
    return new Promise((resolve, reject) => {
      return resolve()
    })
  }
}
export class ElementHandle {
  public click () {
    return null
  }
}
// @ts-ignore
export async function launch (options): Promise<Browser> {
  return new Browser(options)
}
export class Page {
  public win: BrowserWindow
  public web: WebContents
  // @ts-ignore
  constructor (pageOption) {
    pageOption = pageOption || {}
    pageOption = _.assign(pageOption, {webPreferences: {
      allowRunningInsecureContent: true,
      javascript: true,
      plugins: true,
      webSecurity: false,
    }})
    const bro = this.win = new BrowserWindow(pageOption)
    // const bro = this.win = new BrowserWindow({
    //   width: 1000,
    //   height: 700,
    //   minWidth: 720,
    //   minHeight: 450,
    //   show: false,
    // })
    this.web = this.win.webContents
    // this.web.openDevTools()

    this.win.once('ready-to-show', () => {
      this.win.show()
    })
    const tray = new Tray(path.resolve(__dirname,'..') + '/icon/tray_white.png');
    const trayContextMenu = Menu.buildFromTemplate([
      {
        label: '最大化',
        accelerator: 'CommandOrControl+G',
        click: () => {
          showAndFocusWindow()
        },
      },
      {
        label: '最小化',
        accelerator: 'CommandOrControl+H',
        click: () => {
          miniWindow()
        },
      },
      {
        label: '开发者工具',
        accelerator: 'CommandOrControl+Shift+I',
        click() {
          // @ts-ignore
          bro.show()
          // @ts-ignore
          bro.focus()
          // @ts-ignore
          bro.toggleDevTools()
        },
      },
      // {
      //   label: '清除浏览器设置',
      //   click() {
      //     clearAppData();
      //   }
      // },
      {
        label: '退出',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          quit();
        },
      },
    ]);
    tray.setToolTip('微信');
    tray.setContextMenu(trayContextMenu)
    tray.on('click', () => {
      showAndFocusWindow()
    })

    // Emitted when the window is closed.
    this.win.on('closed', function () {
      // @ts-ignore
      this.win = null
    })

    /**
     * 窗体关闭事件处理
     * 默认只会隐藏窗口
     */
    this.win.on('close', (e) => {
      e.preventDefault()
      bro.hide()
    })
    /**
     * 最小化
     */
    function miniWindow() {
      bro.minimize()
    }

    /**
     * 最大化
     */
    function showAndFocusWindow(){
      bro.show()
      bro.focus()
    }

    /**
     * 退出应用
     */
    function quit() {
      if (!tray.isDestroyed()) tray.destroy()
      BrowserWindow.getAllWindows()
        .forEach(item => {
          if (!item.isDestroyed()) item.destroy()
        })
      if (process.platform !== 'darwin') {
        app.quit()
      }
    }

    // @ts-ignore
    session.defaultSession.webRequest.onCompleted({urls: [
          'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit*',
          'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit*',
          'https://wx.qq.com/?&lang*',
          'https://wx2.qq.com/?&lang*'
        ]},
      (details) => handleRequest(details)
    )

    function handleRequest(details: Electron.OnCompletedDetails) {
      // console.log(details.url)
      details.url.startsWith('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxinit') && login()
      details.url.startsWith('https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit') && login()
      details.url.startsWith('https://wx.qq.com/?&lang') && logout()
      details.url.startsWith('https://wx2.qq.com/?&lang') && logout()
    }

    function login() {
      bro.hide()
      bro.setSize(1000, 670, true)
      bro.setResizable(true)
      bro.show()
    }

    function logout() {
      bro.setSize(380, 500, true)
    }

    this.web.on('dom-ready', () => {

      this.web.insertCSS(CssInjector.login)
      this.web.insertCSS(CssInjector.main)
      this.web.executeJavaScript(`
            let faLink = document.createElement('link');
            faLink.setAttribute('rel', 'stylesheet');
            faLink.type = 'text/css';
            faLink.href = 'https://use.fontawesome.com/releases/v5.0.13/css/all.css';
            faLink.integrity = 'sha384-DNOHZ68U8hZfKXOrtjWvjxusGo9WQnrNx2sqG0tfsghAvtVlRW3tvkXWZh58N9jp';
            faLink.crossOrigin = 'anonymous';
            document.head.appendChild(faLink);
        `)
      this.web.executeJavaScript(`
            document.title = '微信，是一个生活方式';
            new MutationObserver(mutations => {
                if (document.title !== '微信，是一个生活方式') {
                    document.title = '微信，是一个生活方式';
                }
            }).observe(document.querySelector('title'), {childList: true});
        `)
      this.web.executeJavaScript(`
            let toggleButton = document.createElement('i');
            toggleButton.className = 'toggle_contact_button fas fa-angle-double-left';
            toggleButton.onclick = () => {
                toggleButton.classList.toggle('mini');
                document.querySelector('.panel').classList.toggle('mini');
            };
            let titleBar = document.querySelector('.header');
            titleBar.appendChild(toggleButton);
        `)

    })

  }

  public async close (): Promise<any> {
    // @ts-ignore
    return new Promise((resolve, reject) => {
      this.win.close()
      resolve()
    })
  }
  public url (): string {
    return this.web.getURL()
  }

  public async evaluate (params: string): Promise<any> {
    // @ts-ignore
      return new Promise((resolve, reject) => {
        this.web.executeJavaScript(params, false, (result) => {
          // console.log(result)
          return resolve(result)
        })
      })
  }
  // @ts-ignore
  public async exposeFunction (fname: string, callback: Function): Promise<any> {
    // @ts-ignore
    return new Promise((resolve, reject) => {
      return resolve()
    })
  }
  /**
   *
   * @param {'load'} eventName
   * @param callback
   */
  // @ts-ignore
  public on (eventName: string, callback: Function) {
    if (eventName === 'load') {
// @ts-ignore
      this.web.addListener('did-finish-load', (event) => {
        // console.log('触发一次完成回调')
        callback()
      })
    }
    if (eventName === 'error') {
      // @ts-ignore
      this.web.addListener('crashed', (event, killed) => {
        callback(event)
     })
    }
  }
  public bindEvent (eventName: string, callback: Function) {
    // @ts-ignore
    ipcMain.on( eventName, (event, args) => {
      callback(eventName, args)
    })
  }

  public async goto (url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      this.web.on('did-fail-load', (event, errorCode, errorMessage) => {
        // console.log('加载页面失败')
        reject(errorMessage)
      })
      // @ts-ignore
      this.web.on('did-finish-load', (event) => {
        // console.log('加载页面完成')
        resolve()
      })
      try {
        // console.log('加载url')
        this.web.loadURL(url)
      } catch (e) {
        console.log(e)
      }
    })
  }
  // @ts-ignore
  public async setCookie (...args: Cookie[]): Promise<any> {
    return new Promise((resolve, reject) => {
      args.forEach((value) => {
        // console.log(value)
        this.web.session.cookies.set( _.assign({ url: 'http://wx.qq.com' }, value), (err) => {
          console.log(value, err)

          reject()
        })
      })
      return resolve()
    })
  }

  public async reload (): Promise<any> {
    // @ts-ignore
    return new Promise((resolve, reject) => {
      this.win.reload()
      return resolve()
    })
  }
  public async send (event: string, ...args: any[]): Promise<any> {
    // @ts-ignore
    return new Promise((resolve, reject) => {
      // @ts-ignore
      ipcMain.once(`bridge-${event}`, (evt, arg) => {
        resolve(arg)
      })
      this.web.send('bridge', {
        method: event,
        args: args.length > 0 ? args : null,
      })
    })
  }
  // @ts-ignore
  public async waitForFunction (code: string): Promise<boolean> {
    // @ts-ignore
      return new Promise<boolean>((resolve, reject) => {
        this.web.executeJavaScript(code, false, (result) => {
          if (result.toString() === 'true') {
            resolve(true)
          } else {
            setTimeout(() => {
              resolve(false)
            }, 100)
          }
        })
        // return resolve('message')
      })

  }
  public async cookies (filter: any): Promise<Cookie[]> {
    return new Promise<Cookie[]>((resolve, reject) => {
      this.web.session.cookies.get(filter, (error, cookies) => {
        if (error) {
          reject(error)
        } else {
          resolve(cookies)
        }
      })
    })
  }
}
export default{
  Browser,
  Dialog,
  ElementHandle,
  launch,
  Page,
}
