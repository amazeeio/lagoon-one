const got = require('got');
const r = require('ramda')

const { LOGSDB_ADMIN_PASSWORD } = process.env;

const KIBANA_URL = r.propOr(
  'http://logs-db-ui:5601',
  'KIBANA_URL',
  process.env
);

const kibanaClient = got.extend({
  baseUrl: `${KIBANA_URL}/api/`,
  auth: `admin:${LOGSDB_ADMIN_PASSWORD || '<password not set>'}`,
  json: true,
  headers: {
    'kbn-xsrf': 'true',
  },
});

module.exports = kibanaClient;
