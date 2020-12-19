module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  admin: {
    url: '/admin',
    auth: {
      secret: env('ADMIN_JWT_SECRET', '8d4c91ee29b33949e0c9b1a4f97073d5'),
    },
  },
});
