/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const discountRate = 1 - discount / 100;
    const revenue = sale_price * quantity * discountRate;
    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    if (index === 0) return profit * 0.15;
    else if (index === 1 || index === 2) return profit * 0.10;
    else if (index === total - 1) return 0;
    else return profit * 0.05;

}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;

    if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Некорректные данные продавцов');
    }
        if (!Array.isArray(data.products) || !Array.isArray(data.purchase_records)) {
        throw new Error('Некорректные данные');
    }

    if (!options || typeof options.calculateRevenue !== "function" || typeof options.calculateBonus !== "function") {
        throw new Error('Отсутствуют функции расчёта');
    }

    const sellerStats = data.sellers.map((seller) => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        top_products: [],
        bonus: 0,
    }));

    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.seller_id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;
        
        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.top_products[item.sku]) seller.top_products[item.sku] = 0;
            seller.top_products[item.sku] += item.quantity;
        });
    });

    sellerStats.sort((a, b) => b.profit - a.profit);
    
    sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    seller.top_products = Object.entries(seller.top_products)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    });

    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}