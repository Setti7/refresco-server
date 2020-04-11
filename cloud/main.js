Parse.Cloud.define('hello', function (req, res) {
  return 'Hi'
})

Parse.Cloud.define('getStoreGallons', async (req, res) => {
  var store = new Parse.Object('Store')
  store.id = req.params.storeId

  return await store.relation('gallons').query().find()
})

// Parse.Cloud.define('initOrder', async (req, res) => {
// })