var LocalStrategy = require('passport-local').Strategy;

var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);
module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    connection.query("SELECT * FROM users WHERE id = ? ", [id], function(err, rows) {
      done(err, rows[0]);
    });
  });

  passport.use(
    'local-signup',
    new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
      },
      function(req, username, password, done) {
        // check unique username
        connection.query("SELECT * FROM users WHERE username = ? OR email = ? ", [username, req.body.email], function(err, rows) {
          if (err)
            return done(err);
          if (rows.length) {
            return done(null, false, req.flash('signupMessage', 'That username/email is already taken.'));
          } else {
            var newUserMysql = {
              username: username,
              password: bcrypt.hashSync(password, null, null),
            };
            var insertQuery = "INSERT INTO users ( username, password, firstname, lastname, email ) values (?,?,?,?,?)";

            connection.query(insertQuery, [newUserMysql.username, newUserMysql.password, req.body.firstname, req.body.lastname, req.body.email], function(err, rows) {
              newUserMysql.id = rows.insertId;
              return done(null, newUserMysql);
            });
          }
        });


      })
  );

  passport.use(
    'local-login',
    new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
      },
      function(req, username, password, done) {
        connection.query("SELECT * FROM users WHERE username = ?", [username], function(err, rows) {
          if (err)
            return done(err);

          // user does not exist
          if (!rows.length) {
            return done(null, false, req.flash('loginMessage', 'The username you entered does not match any account.'));
          }

          // wrong password
          if (!bcrypt.compareSync(password, rows[0].password)) {
            return done(null, false, req.flash('loginMessage', 'The password you entered is incorrect.'));
          }

          return done(null, rows[0]);
        });
      })
  );
};
