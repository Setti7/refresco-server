Parse.Cloud.define('hello', function (req, res) {
  return 'Hi'
})

Parse.Cloud.define('initOrder', async (req, res) => {
  /// Inputs
  ///   - address: AddressPointerInput!
  ///   - products: [CreateOrderItemFieldsInput!]!

  console.log(req.params.products)

  // Create types
  const Order = Parse.Object.extend('Order')
  const Address = Parse.Object.extend('Address')
  const Store = Parse.Object.extend('Store')
  const User = Parse.Object.extend('User')
  const PaymentMethod = Parse.Object.extend('PaymentMethod')

  // Create order
  let order = new Order()
  let orderItemsRelation = order.relation('products')

  // Setting required fields
  let user = new User()
  user.id = 'Lkwpbo84eg' // from session

  let store = new Store()
  store.id = 'qmKKCBVqXG' // would be another param

  let paymentMethod = new PaymentMethod()
  paymentMethod.id = 'UOZrC98GJE' // another param

  order.set('orderStatus', 'draft')
  order.set('buyer', user)
  order.set('store', store)
  order.set('paymentMethod', paymentMethod)

  /// Get Address from input
  let address
  if ('link' in req.params.address) {
    address = new Address()
    address.id = req.params.address.link
  } else if ('createAndLink' in req.params.address) {
    // Create and link to order

    // Do I need to manually set all those address fields? What is the best way
    // to create an object directly from params when using graphql?
  }

  order.set('address', address)

  // Create orderItems
  req.params.products.forEach(async (product) => {
    const OrderItem = Parse.Object.extend('OrderItem')
    const Product = Parse.Object.extend('Gallon')

    let newOrderItem = new OrderItem()
    let newProduct = new Product()

    newProduct.id = product.product.link

    newOrderItem.set('amount', 10)
    newOrderItem.set('product', newProduct)
    console.log(newOrderItem.toJSON())
    let savedOrderitem = await newOrderItem.save()
    console.log(savedOrderitem.toJSON())

    // For some reason the orderItems aren't being added to the relation.
    orderItemsRelation.add(savedOrderitem)
  })

  const saved = await order.save()
  console.log(saved.toJSON())

  /// When creating an object of a generated class with graphql, the return type
  // is actually CreateOrderPayload. How can I return such thing?
  return saved
})

Parse.Cloud.define('getBestStores', async req => {
  const storesQuery = new Parse.Query('Store').include('address')
  storesQuery.greaterThan('rating', req.params.minimumRating)
  // throw Error('Something failed...');

  return await storesQuery.find()
})