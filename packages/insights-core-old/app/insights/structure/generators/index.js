const postgresGenerator = require('./postgres')

module.exports = async function createAdapter (connection) {
  if (connection.indexOf('postgresql://') === 0 || connection.indexOf('psql://') === 0) {
    return postgresGenerator(connection)
  } else {
    throw new Error('No compatible database found!')
  }
}
