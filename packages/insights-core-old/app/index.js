const path = require('path')
const favicon = require('serve-favicon')
const compress = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const bodyParser = require('body-parser')

const feathers = require('feathers')
const hooks = require('feathers-hooks')
const rest = require('feathers-rest')
const socketio = require('feathers-socketio')

const middleware = require('./middleware')
const services = require('./services')
const appHooks = require('./app.hooks')

const authentication = require('./authentication')

const app = feathers()

// set path of config to insights-core/config
const configDir = path.join(__dirname, '..', 'config')
process.env.NODE_CONFIG_DIR = configDir

const configuration = require('feathers-configuration')

app.configure(configuration())

if (process.env.INSIGHTS_DATA) {
  app.set('nedb', process.env.INSIGHTS_DATA)
}

// Enable CORS, security, compression, favicon and body parsing
app.use(cors())
app.use(helmet())
app.use(compress())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

console.log(app.get('public'))
app.use(favicon(path.join(app.get('public'), 'assets', 'favicon.ico')))

app.get('/', serveHtmlForEnvironment)

// Host the public folder
app.use('/assets', feathers.static(path.join(app.get('public'), 'assets')))
if (process.env.NODE_ENV === 'production') {
  app.use('/dist', feathers.static(path.join(app.get('public'), 'dist')))
}

// Set up Plugins and providers
app.configure(hooks())
app.configure(rest())
app.configure(socketio())

app.configure(authentication)

// Set up our services (see `services/index.js`)
app.configure(services)

// Configure middleware (see `middleware/index.js`) - always has to be last
app.configure(middleware)
app.hooks(appHooks)

// catch all for react
app.get('*', serveHtmlForEnvironment)

module.exports = app

function serveHtmlForEnvironment (req, res) {
  var html = path.join(app.get('public'), process.env.NODE_ENV === 'development' ? 'index-dev.html' : 'index.html')
  res.sendFile(html)
}
