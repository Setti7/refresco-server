Parse.Cloud.define('hello', async req => {
  return 'Hi'
})

Parse.Cloud.define('initOrder', async req => {
  const user = req.user
  if (!user) {
    throw new Error('Unauthorized')
  }

  const fields = req.params['input']['fields']

  // Create Order object
  let order = new Parse.Object('Order')
  let orderItemsRelation = order.relation('orderItem')

  // Get store
  const storeQuery = new Parse.Query('Store')
  const store = await storeQuery.get(fields['store'])

  // Create address
  const addressJson = fields['address']
  let address = new Parse.Object('Address', {
    'streetName': addressJson['streetName'],
    'number': addressJson['number'],
    'city': addressJson['city'],
    'state': addressJson['state'],
    'district': addressJson['district'],
    'country': addressJson['country'],
    'pointOfReference': addressJson['pointOfReference'],
    'complement': addressJson['complement'],
    'coordinate': new Parse.GeoPoint(addressJson['coordinate']['latitude'],
      addressJson['coordinate']['longitude']),
    'postalCode': addressJson['postalCode'],
  })
  address = await address.save()

  // Create order items
  const orderItemsJson = fields['orderItems']

  for (const json of orderItemsJson) {
    if ('createAndLink' in json['product']) {
      throw new Error('createAndLink not available. Use link instead.')
    }

    // TODO: check if gallon is from the same store
    const orderItem = new Parse.Object('OrderItem')
    let linkedGallon = new Parse.Object('Gallon')
    linkedGallon.id = json['product']['link']

    orderItem.set('amount', json['amount'])
    orderItem.set('product', linkedGallon)
    let savedOrderItem = await orderItem.save()

    orderItemsRelation.add(savedOrderItem)
  }

  // Get payment method
  const paymentMethodQuery = new Parse.Query('PaymentMethod')
  const paymentMethod = await paymentMethodQuery.get(
    fields['paymentMethod'])

  // Set fields
  order.set('address', address)
  order.set('store', store)
  order.set('paymentMethod', paymentMethod)
  order.set('orderStatus', 'pending')
  order.set('change', fields['change'])
  order.set('buyer', user)

  const savedOrder = await order.save();
  return {
    'order': savedOrder,
    'clientMutationId': req.params['clientMutationId']
  }
})