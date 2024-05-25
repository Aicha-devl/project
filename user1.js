var dbHandler = require('../lib/databaseHandler').dbHandler;
var constants = require('../lib/constants');

exports.registerUser = function (handlerInfo, data, callback) {
    var sql = 'INSERT INTO users SET ?';
    dbHandler.getInstance().executeQuery(sql, data, function (err, insert) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

exports.getUser = function (handlerInfo, userId, callback) {
    var sql = 'SELECT * FROM users WHERE id = ?';
    dbHandler.getInstance().executeQuery(sql, [userId], function (err, user) {
        if (err) {
            return callback(err);
        }
        callback(null, user[0]);
    });
};

exports.checkIfUsernameAlreadyExists = function (handlerInfo, username, callback) {
    var sql = 'SELECT username FROM users WHERE username = ?';
    dbHandler.getInstance().executeQuery(sql, [username], function (err, user) {
        if (err) {
            return callback(new Error("Error in fetching data"));
        }

        if (user.length) {
            err = new Error();
            err.flag = constants.responseFlags.USERNAME_ALREADY_EXISTS;
            return callback(err);
        }
        callback();
    });
};

exports.getUserByUsername = function (handlerInfo, username, callback) {
    var sql = 'SELECT * FROM users WHERE username = ?';
    dbHandler.getInstance().executeQuery(sql, [username], function (err, user) {
        if (err) {
            return callback(err);
        }

        if (!user.length) {
            err = new Error("No user found.");
            err.flag = constants.responseFlags.USER_NOT_FOUND;
            return callback(err);
        }
        callback(null, user[0]);
    });
};

exports.createSession = function (handlerInfo, userId, sessionId, callback) {
    var sql = 'UPDATE users SET auth_token = ? WHERE id = ?';
    dbHandler.getInstance().executeQuery(sql, [sessionId, userId], function (err, insert) {
        if (err) {
            return callback(err);
        }
        callback(null, sessionId);
    });
};

exports.checkIfUserExists = function (handlerInfo, uuid, callback) {
    var sql = 'SELECT * FROM users WHERE uuid = ?';
    dbHandler.getInstance().executeQuery(sql, [uuid], function (err, user) {
        if (err) {
            return callback(err);
        }

        if (!user.length) {
            err = new Error("No user found.");
            err.flag = constants.responseFlags.USER_NOT_FOUND;
            return callback(err);
        }
        callback();
    });
};

// Fonction pour supprimer un utilisateur
exports.deleteUser = function (handlerInfo, userId, callback) {
    var sql = 'DELETE FROM users WHERE id = ?';
    dbHandler.getInstance().executeQuery(sql, [userId], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};
