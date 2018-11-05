#!/usr/bin/env ts-node

import { PuppetManager } from '../src/wechaty/puppet-manager'

PuppetManager.installAll()
.catch(e => {
  console.error(e)
  process.exit(1)
})
