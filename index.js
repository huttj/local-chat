require('dotenv-safe').load();
const PORT = process.argv[2];
if (PORT) {
  process.env.PORT = PORT;
}
require('./server');