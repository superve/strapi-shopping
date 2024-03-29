module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        /*
              client: 'mysql',
              host: env('DATABASE_HOST', 'localhost'),
              port: env.int('DATABASE_PORT', 3306),
              database: env('DATABASE_NAME', 'strapi_shopping'),
              username: env('DATABASE_USERNAME', 'root'),
              password: env('DATABASE_PASSWORD', '123456'),
              ssl: env.bool('DATABASE_SSL', false),
        */
        client: 'sqlite',
        filename: env('DATABASE_FILENAME', '.tmp/data.db')
      },
      options: {
        useNullAsDefault: true,
      }
    },
  },
});
