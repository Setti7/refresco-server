Parse.Cloud.define('hello', function (req, res) {
  return 'Hi'
})

Parse.Cloud.define('getStoreGallons', async (req, res) => {
  var store = new Parse.Object('Store')
  store.id = req.params.storeId

  return await store.relation('gallons').query().find()
})

Parse.Cloud.define('initOrder', async (req, res) => {

  // var currentUser = request.user;
  // console.log(currentUser.name);
  const orderQuery = new Parse.Query('Order')
  orderQuery
    // .include('store.address')
    // .include('address')
    // .include('buyer')
    // .include('paymentMethod')
    .include('products');
  const order = await orderQuery.get(req.params.objectId);
  console.log(order);

  return order;

  // return 'OrderCreated';
})

Parse.Cloud.define('getBestStores', async req => {
  const storesQuery = new Parse.Query('Store')
  storesQuery.greaterThan('rating', req.params.minimumRating)
  // throw Error('Something failed...');

  return await storesQuery.find()

})