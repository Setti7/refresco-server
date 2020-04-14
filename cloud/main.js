Parse.Cloud.define('hello', async req => {
  return 'Hi'
})

Parse.Cloud.define('initOrder', async req => {
  let user = req.user
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Create Order object
  let order = new Parse.Object('Order')
  let orderItemsRelation = order.relation('orderItems')

  // Get store
  let storeQuery = new Parse.Query('Store')
  let store = await storeQuery.get(req.params.store)

  // Create address
  let addressJson = req.params.address
  let address = new Parse.Object('Address', {
    'streetName': addressJson.streetName,
    'number': addressJson.number,
    'city': addressJson.city,
    'state': addressJson.state,
    'district': addressJson.district,
    'country': addressJson.country,
    'pointOfReference': addressJson.pointOfReference,
    'complement': addressJson.complement,
    'coordinate': new Parse.GeoPoint(addressJson.coordinate.latitude,
      addressJson.coordinate.longitude),
    'postalCode': addressJson.postalCode,
  })
  address = await address.save()

  // Create order items
  let orderItemsJson = req.params.orderItems

  for (const json of orderItemsJson) {
    if ('createAndLink' in json.product) {
      throw new Error('createAndLink not available. Use link instead.')
    }

    // TODO: check if gallon is from the same store
    let orderItem = new Parse.Object('OrderItem')
    let linkedGallon = new Parse.Object('Gallon')
    linkedGallon.id = json.product.link

    orderItem.set('amount', json.amount)
    orderItem.set('product', linkedGallon)
    let savedOrderItem = await orderItem.save()

    orderItemsRelation.add(savedOrderItem)
  }

  // Get payment method
  let paymentMethodQuery = new Parse.Query('PaymentMethod')
  let paymentMethod = await paymentMethodQuery.get(req.params.paymentMethod)

  // Set fields
  order.set('address', address)
  order.set('store', store)
  order.set('paymentMethod', paymentMethod)
  order.set('orderStatus', 'pending')
  order.set('change', req.params.change)
  order.set('buyer', user)

  return await order.save()
})