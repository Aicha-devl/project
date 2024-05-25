var dbHandler = require('../lib/databaseHandler').dbHandler;
var constants = require('../lib/constants');
var _ = require('lodash');

// Fonction pour créer un nouvel élément dans la table 'items'
exports.createNewItem = function (handlerInfo, data, callback) {
    var sql = 'INSERT INTO items SET ?';
    dbHandler.getInstance().executeQuery(sql, data, function (err, insert) {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

// Fonction pour récupérer la liste des éléments ou un élément spécifique si 'itemId' est fourni
exports.getItemList = function (handlerInfo, itemId, callback) {
    var sql = 'SELECT uuid as item_id, name, brand, category FROM items';
    var values = [];
    if (itemId) {
        sql += ' WHERE uuid = ?';
        values.push(itemId);
    }
    dbHandler.getInstance().executeQuery(sql, values, function (err, items) {
        if (err) {
            return callback(err);
        }
        callback(null, items);
    });
};

// Fonction pour mettre à jour un élément existant dans la table 'items'
exports.updateItem = function (handlerInfo, data, itemId, callback) {
    var sql = 'UPDATE items SET ? WHERE uuid = ?';
    dbHandler.getInstance().executeQuery(sql, [data, itemId], function (err, update) {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

// Fonction pour vérifier si un élément existe dans la table 'items' par UUID
exports.checkIfItemExists = function (handlerInfo, itemId, callback) {
    var sql = 'SELECT * FROM items WHERE uuid = ?';
    dbHandler.getInstance().executeQuery(sql, [itemId], function (err, item) {
        if (err) {
            return callback(new Error("Error in fetching data"));
        }
        if (!item.length) {
            err = new Error();
            err.flag = constants.responseFlags.ITEM_NOT_FOUND;
            return callback(err);
        }
        callback(null);
    });
};

// Fonction pour créer une nouvelle variante dans la table 'variant'
exports.createNewVariant = function (handlerInfo, data, callback) {
    var sql = 'INSERT INTO variant SET ?';
    dbHandler.getInstance().executeQuery(sql, data, function (err, insert) {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

// Fonction pour mettre à jour une variante existante dans la table 'variant'
exports.updateVariant = function (handlerInfo, data, properties, variantId, callback) {
    var sql = 'UPDATE variant SET ';
    var setter = [];
    var values = [];
    if (!_.isEmpty(properties)) {
        if (!_.isEmpty(data)) {
            for (var dataKey in data) {
                if (data.hasOwnProperty(dataKey)) {
                    setter.push(dataKey + '= ?');
                    values.push(data[dataKey]);
                }
            }
        }
        setter.push('properties = JSON_SET(properties');
        for (var propKey in properties) {
            if (properties.hasOwnProperty(propKey)) {
                setter.push('"$.' + propKey + '", ?');
                values.push(properties[propKey]);
            }
        }
        sql += setter.join(', ');
        sql += ')';
    } else {
        sql += '?';
        values.push(data);
    }
    sql += ' WHERE uuid = ?';
    values.push(variantId);
    dbHandler.getInstance().executeQuery(sql, values, function (err, update) {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

// Fonction pour vérifier si une variante existe et est active dans la table 'variant'
exports.checkIfVariantExists = function (handlerInfo, variantId, callback) {
    var sql = 'SELECT * FROM variant WHERE uuid = ? AND status = ?';
    dbHandler.getInstance().executeQuery(sql, [variantId, 'ACTIVE'], function (err, item) {
        if (err) {
            return callback(new Error("Error in fetching data"));
        }
        if (!item.length) {
            err = new Error();
            err.flag = constants.responseFlags.VARIANT_NOT_FOUND;
            return callback(err);
        }
        callback(null);
    });
};

// Fonction pour récupérer la liste des variantes ou une variante spécifique si 'variantId' est fourni
exports.getVariantList = function (handlerInfo, variantId, itemList, callback) {
    var sql = 'SELECT * FROM variant WHERE status = ?';
    var values = ['ACTIVE'];
    if (variantId) {
        sql += ' AND uuid = ?';
        values.push(variantId);
    }
    dbHandler.getInstance().executeQuery(sql, values, function (err, variantList) {
        if (err) {
            return callback(err);
        }
        if (!variantList.length) {
            return callback(null, itemList);
        }
        if (typeof itemList !== 'undefined') {
            var interimResult = {};
            for (var i = 0; i < variantList.length; i++) {
                var variant = variantList[i].item_id;
                if (!interimResult[variant]) {
                    interimResult[variant] = [];
                }
                interimResult[variant].push(variantList[i]);
            }
            for (var j = 0; j < itemList.length; j++) {
                if (interimResult.hasOwnProperty(itemList[j].item_id)) {
                    itemList[j].variant = interimResult[itemList[j].item_id];
                }
            }
            return callback(null, itemList);
        } else {
            return callback(null, variantList);
        }
    });
};

// Fonction pour désactiver une variante en changeant son statut à 'INACTIVE'
exports.deleteVariant = function (handlerInfo, variantId, callback) {
    var sql = 'UPDATE variant SET status = ? WHERE uuid = ?';
    dbHandler.getInstance().executeQuery(sql, ['INACTIVE', variantId], function (err, update) {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

// Fonction pour supprimer un élément dans la table 'items'
exports.deleteItem = function (handlerInfo, itemId, callback) {
    var sql = 'DELETE FROM items WHERE uuid = ?';
    dbHandler.getInstance().executeQuery(sql, [itemId], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Fonction pour supprimer une variante dans la table 'variant'
exports.deleteVariantPermanently = function (handlerInfo, variantId, callback) {
    var sql = 'DELETE FROM variant WHERE uuid = ?';
    dbHandler.getInstance().executeQuery(sql, [variantId], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Fonction pour obtenir la quantité de chaque élément dans l'inventaire
exports.getItemQuantities = function (handlerInfo, callback) {
    var sql = 'SELECT uuid as item_id, quantity FROM items';
    dbHandler.getInstance().executeQuery(sql, [], function (err, items) {
        if (err) {
            return callback(err);
        }
        callback(null, items);
    });
};

// Fonction pour supprimer un élément de l'inventaire
exports.deleteInventoryItem = function (handlerInfo, itemId, callback) {
    var sql = 'DELETE FROM inventory WHERE item_id = ?';
    dbHandler.getInstance().executeQuery(sql, [itemId], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, result);
    });
};

// Fonction pour calculer la quantité totale de chaque élément dans l'inventaire
exports.calculateItemQuantities = function (handlerInfo, callback) {
    var sql = 'SELECT item_id, SUM(quantity) as total_quantity FROM inventory GROUP BY item_id';
    dbHandler.getInstance().executeQuery(sql, [], function (err, quantities) {
        if (err) {
            return callback(err);
        }
        callback(null, quantities);
    });
};

