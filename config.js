const dotenv = require('dotenv')
const path = require('path')

const root = path.join.bind(this, __dirname)
dotenv.config({path: root('.env')})

module.exports = {
  HOST: process.env.HOST || 'localhost',
  PORT: process.env.PORT || 3000
}