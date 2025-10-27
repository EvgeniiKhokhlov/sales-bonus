/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточ ка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const remainderDiscount = 1 - (discount /100)
    return sale_price * quantity * remainderDiscount;
    // @TODO: Расчет выручки от операции
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
    const maxBonus = 0.15;
    const highBonus = 0.10;
    const shortBonus = 0.05;

    if (index === 0) {
    return profit * maxBonus;
} else if (index === 1 || index === 2) {
    return profit * highBonus;
} else if (index === total - 1) {
    return profit * 0;
} else { // Для всех остальных
    return profit * shortBonus;
} 
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if(!data
        ||!Array.isArray(data.customers)
        ||!Array.isArray(data.products)
        ||!Array.isArray(data.sellers)
        ||!Array.isArray(data.purchase_records)
        ||data.customers.length === 0
        ||data.products.length === 0
        ||data.sellers.length === 0
        ||data.purchase_records.length === 0
    )
        {
            throw new Error('Некорректные входные данные');
        }

    // @TODO: Проверка наличия опций
    const {calculateRevenue, calculateBonus } = options;
    if(!calculateRevenue || !calculateBonus) 
        {
            throw new Error('Чего-то не хватает');
        }
    // @TODO: Подготовка промежуточных данных для сбора статистики
        const sellerStats = data.sellers.map(seller => ({
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
        products_sold: {}
        }));
        
    // @TODO: Индексация продавцов и товаров для быстрого доступа
        
        const sellerIndex = sellerStats.reduce((result, item) => ({
            ...result,
            [item.id]: item
        }), {});
        
        const productIndex = data.products.reduce((result, item) => ({
            ...result,
            [item.sku]: item
        }), {});
       
    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count++; // Увеличить общую сумму всех продаж
        seller.revenue += record.total_amount;
        // Расчёт прибыли для каждого товара
        
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            const cost = product.purchase_price * item.quantity;  // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const revenue = calculateRevenue(item, product); // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            seller.profit += (revenue - cost);// Посчитать прибыль: выручка минус себестоимость            
            // Увеличить общую накопленную прибыль (profit) у продавца  

            // Учёт количества проданных товаров
            if(!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
            // По артикулу товара увеличить его проданное количество у продавца
        });
 });
    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((seller1,seller2) => {
    if(seller1.profit > seller2.profit) return -1;
    else if (seller1.profit > seller2.profit) return 1;
    return 0;
    }
    );
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller,index) => {
        seller.bonus = calculateBonus(index,sellerStats.length,seller)
        seller.top_products = Object.entries(seller.products_sold).map(item => item);
        seller.top_products.sort((product1,product2) => {
            if(product2[1] < product1[1]) return -1;
            else if(product2[1] > product1[1]) return 1;
            return 0; 
        });
        seller.top_products = seller.top_products.slice(0,10);
    })

    return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products.map(product => ({
            sku:product[0],
            quantity: product[1] })),// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
})); 
    // @TODO: Подготовка итоговой коллекции с нужными полями
}
