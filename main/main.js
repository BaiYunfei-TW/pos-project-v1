const database = require('./datbase');
const _ = require('lodash')

module.exports = function main(inputs) {
    (_.flow([
        countItems,
        calculateItemSummary,
        calculateOrderSummary,
        renderInvoice,
        printInvoice
    ]))(inputs);
};

function parseCount(str) {
    if (str.includes('-')) {
        return {key: str.substring(0, str.indexOf('-')), count: parseInt(str.substring(str.indexOf('-') + 1))}
    }
    return {key: str, count: 1};
}

function isInPromotion(barcode) {
    var promotionList = database.loadPromotions();
    return promotionList[0].barcodes.includes(barcode);
}

function renderInvoice(order) {
    var invoice = '***<没钱赚商店>购物清单***\n';
    order.sales.forEach(function (item) {
        invoice += `名称：${item.item.name}，数量：${item.count}${item.item.unit}，单价：${item.item.price.toFixed(2)}(元)，小计：${item.price.toFixed(2)}(元)\n`
    })
    invoice += '----------------------\n' +
        '挥泪赠送商品：\n';
    order.gifts.forEach(function (item) {
        invoice += `名称：${item.item.name}，数量：${item.count}${item.item.unit}\n`;
    })
    invoice += '----------------------\n' +
        `总计：${order.totalPrice.toFixed(2)}(元)\n` +
        `节省：${order.savedPrice.toFixed(2)}(元)\n` +
        '**********************';
    return invoice;
}


function calculateOrderSummary(order) {
    order.sales.forEach(function (item) {
        order.totalPrice += item.price;
    })

    order.gifts.forEach(function (item) {
        order.savedPrice += item.price
    })
    return order;
}

function calculateItemSummary(countMap, itemList) {
    var itemList = database.loadAllItems();
    var order = {
        sales: [],
        gifts: [],
        totalPrice: 0,
        savedPrice: 0
    };

    //计算付费和计算项目
    for (var barcode in countMap) {
        var count = countMap[barcode];
        var freeCount = 0;
        var item = itemList.find(function (item) {
            if (item.barcode === barcode) {
                return true;
            }
            return false;
        })
        if (count > 2 && isInPromotion(barcode)) {
            order.gifts.push({
                item: item,
                barcode: barcode,
                count: 1,
                price: item.price
            });
            freeCount = 1;
        }
        order.sales.push({
            item: item,
            barcode: barcode,
            count: count,
            freeCount: freeCount,
            price: item.price * (count - freeCount)
        });
    }
    return order;
}

function countItems(inputs) {
    var countMap = inputs.reduce(function (map, item) {
        var count = parseCount(item);
        if (map[count.key] === undefined) {
            map[count.key] = count.count;
            return map;
        }
        map[count.key] += count.count;
        return map;
    }, {});
    return countMap;
}

function printInvoice(invoice) {
    console.log(invoice);
}