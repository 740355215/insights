const structure = require('./structure/structure.service.js')
const results = require('./results/results.service.js')
const views = require('./views/views.service.js')
const dashboards = require('./dashboards/dashboards.service.js')
const url = require('./url/url.service.js')
const dashboardItems = require('./dashboard-items/dashboard-items.service.js')
const users = require('./users/users.service.js')
const connections = require('./connections/connections.service.js')
const connectionTest = require('./connection-test/connection-test.service.js')
const favourites = require('./favourites/favourites.service.js')

module.exports = function () {
  const app = this // eslint-disable-line no-unused-vars
  app.configure(structure)
  app.configure(results)
  app.configure(views)
  app.configure(dashboards)
  app.configure(url)
  app.configure(dashboardItems)
  app.configure(users)
  app.configure(connections)
  app.configure(connectionTest)
  app.configure(favourites)
}
