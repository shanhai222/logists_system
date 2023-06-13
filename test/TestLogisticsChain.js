var LogisticsChain = artifacts.require('LogisticsChain')

contract('LogisticsChain', function(accounts) {
    var logisticsChain

    // Declare few constants and assign a few sample accounts generated by ganache-cli
    var ownerID = accounts[0]
    const consigner = accounts[1]
    const consignee = accounts[2]
    const transportCompany = accounts[3]
    const transferStation1 = accounts[4]
    const transferStation2 = accounts[5]
    const transferStation3 = accounts[6]
    const stations = [transferStation1, transferStation2, transferStation3]; 

    // declare a order
    const productName = "bread"
    const productCode = 101
    const productPrice = 5
    const productQuantity = 2
    const orderID = 1
    var logisticsID = 1
    var orderState = 0
    var logisticsState = 3
    const orderCreatedDate = 20230602

    console.log("<----------------ACCOUNTS----------------> ")
    console.log("Contract Owner: ", ownerID)
    console.log("Consigners: ", consigner)
    console.log("Consignees: ", consignee)
    console.log("Transport Companys: ", transportCompany)
    console.log("Transfer Stations: ", transferStation1, transferStation2, transferStation3)


    console.log("<-------TESTING CONTRACT FUNCTIONS------->")
    // Deploy SupplyChain and Register Actors
    it("0. Deploy LogisticsChain and Register Actors", async () => {
        logisticsChain = await LogisticsChain.deployed();

        // Declare and Initialize a variable for event
        var eventEmitted = false

        logisticsChain.ConsignerAdded()
        .on('data', (event) => {
            eventEmitted = true;
            console.log('ConsignerAdded event:', event.returnValues);
        })
        .on('error', console.error);


        logisticsChain.ConsigneeAdded()
        .on('data', (event) => {
            eventEmitted = true;
            console.log('ConsigneeAdded event:', event.returnValues);
        })
        .on('error', console.error);


        logisticsChain.TransferStationAdded()
        .on('data', (event) => {
            eventEmitted = true;
            console.log('TransferStationAdded event:', event.returnValues);
        })
        .on('error', console.error);


        logisticsChain.TransportCompanyAdded()
        .on('data', (event) => {
            eventEmitted = true;
            console.log('TransportCompanyAdded event:', event.returnValues);
        })
        .on('error', console.error);

        await logisticsChain.addConsigner(consigner, { from: ownerID })
        await logisticsChain.addConsignee(consignee, { from: ownerID })
        await logisticsChain.addTransportCompany(transportCompany, { from: ownerID })
        await logisticsChain.addTransferStation(transferStation1, { from: ownerID })
        await logisticsChain.addTransferStation(transferStation2, { from: ownerID })
        await logisticsChain.addTransferStation(transferStation3, { from: ownerID })
    })

    it("1. Create Orders and Search for Details", async () => {
        var eventEmitted = false

        logisticsChain.OrderCreated()
        .on('data', (event) => {
            eventEmitted = true;
            console.log('OrderCreated event:', event.returnValues);
        })
        .on('error', console.error);

        await logisticsChain.initOrdersForConsignee(consigner,consignee,productName,productCode,productPrice,productQuantity,orderCreatedDate,{ from: consignee })

        // Retrieve the just now saved item from blockchain by calling function
        const ordersOfConsignee = await logisticsChain.searchForOrdersOfCaller.call(consignee)
        const ordersOfConsigner = await logisticsChain.searchForOrdersOfCaller.call(consigner)
        
        const consigneeOrderDetail = await logisticsChain.searchForOrderDetails.call(orderID, { from: consignee })
        const consignerOrderDetail = await logisticsChain.searchForOrderDetails.call(orderID, { from: consigner })

        assert.equal(ordersOfConsignee, orderID, 'Error: Invalid OrderId Colllection of Consigee')
        assert.equal(consigneeOrderDetail[0], consigner, 'Error: Missing or Invalid Consigner Message')
        assert.equal(consigneeOrderDetail[1], consignee, 'Error: Missing or Invalid Consignee Message')
        assert.equal(consigneeOrderDetail[2], productName, 'Error: Missing or Invalid Product Name')
        assert.equal(consigneeOrderDetail[3], productCode, 'Error: Missing or Invalid Product Code')
        assert.equal(consigneeOrderDetail[4], productPrice, 'Error: Missing or Invalid Product Price')
        assert.equal(consigneeOrderDetail[5], productQuantity, 'Error: Missing or Invalid Product Quantity')
        assert.equal(consigneeOrderDetail[6], orderState, 'Error: Missing or Invalid State of Order')
        assert.equal(consigneeOrderDetail[7], orderID, 'Error: Missing or Invalid OrderId')
        assert.equal(consigneeOrderDetail[8], orderCreatedDate, 'Error: Missing or Invalid Created Date of Order')

        assert.equal(ordersOfConsigner, orderID, 'Error: Invalid OrderId Colllection of Consigner')
        assert.equal(consignerOrderDetail[0], consigner, 'Error: Missing or Invalid Consigner Message')
        assert.equal(consignerOrderDetail[1], consignee, 'Error: Missing or Invalid Consignee Message')
        assert.equal(consignerOrderDetail[2], productName, 'Error: Missing or Invalid Product Name')
        assert.equal(consignerOrderDetail[3], productCode, 'Error: Missing or Invalid Product Code')
        assert.equal(consignerOrderDetail[4], productPrice, 'Error: Missing or Invalid Product Price')
        assert.equal(consignerOrderDetail[5], productQuantity, 'Error: Missing or Invalid Product Quantity')
        assert.equal(consignerOrderDetail[6], orderState, 'Error: Missing or Invalid State of Order')
        assert.equal(consignerOrderDetail[7], orderID, 'Error: Missing or Invalid OrderId')
        assert.equal(consignerOrderDetail[8], orderCreatedDate, 'Error: Missing or Invalid Created Date of Order')
    })

    it('2. Testing smart contract function convertOrdersIntoLogisicsByConsigners() that allows consigners to convert orders into logisics and Testing searching for logistics details', async () => {
        var eventEmitted = false

        logisticsChain.OrderProceeding()
        .on('data', (event) => {
            eventEmitted = true;
            //orderState = 1;
            console.log('OrderProceeding event:', event.returnValues);
        })
        .on('error', console.error);

        orderState = 1;

        logisticsChain.DeliveredByConsigner()
        .on('data', (event) => {
            eventEmitted = true;
            console.log('DeliveredByConsigner event:', event.returnValues);
        })
        .on('error', console.error);

        await logisticsChain.convertOrdersIntoLogisicsByConsigners(orderID, transportCompany, { from: consigner })

        // check the change of orders' state
        const consigneeOrderDetail = await logisticsChain.searchForOrderDetails.call(orderID, { from: consignee })
        const consignerOrderDetail = await logisticsChain.searchForOrderDetails.call(orderID, { from: consigner })
        
        assert.equal(consigneeOrderDetail[6], orderState, 'Error: Invalid State of Order')
        assert.equal(consignerOrderDetail[6], orderState, 'Error: Invalid State of Order')

        // check the generation of logistics
        const logisticsOfConsignee = await logisticsChain.searchForLogisticsOfCaller.call(consignee)
        const logisticsOfConsigner = await logisticsChain.searchForLogisticsOfCaller.call(consigner)

        assert.equal(logisticsOfConsignee, logisticsID, 'Error: Invalid LogisticsId Colllection of Consigee')
        assert.equal(logisticsOfConsigner, logisticsID, 'Error: Invalid LogisticsId Colllection of Consiger')

        // check logistics details
        const consigneeLogisticsDetail = await logisticsChain.searchForLogisticsDetails.call(logisticsID, { from: consignee })
        const consignerLogisticsDetail = await logisticsChain.searchForLogisticsDetails.call(logisticsID, { from: consigner })

        assert.equal(consigneeLogisticsDetail[0], consigner, 'Error: Missing or Invalid Consigner Message')
        assert.equal(consigneeLogisticsDetail[1], consignee, 'Error: Missing or Invalid Consignee Message')
        assert.equal(consigneeLogisticsDetail[2], transportCompany, 'Error: Missing or Invalid Transport Company Message')
        assert.equal(consigneeLogisticsDetail[3], productName, 'Error: Missing or Invalid Product Name')
        assert.equal(consigneeLogisticsDetail[4], productCode, 'Error: Missing or Invalid Product Code')
        assert.equal(consigneeLogisticsDetail[5], productPrice, 'Error: Missing or Invalid Product Price')
        assert.equal(consigneeLogisticsDetail[6], productQuantity, 'Error: Missing or Invalid Product Quantity')
        //assert.equal(consigneeLogisticsDetail[7].length === 0, 'Error: Missing or Invalid Transfer Stations Message')
        assert.equal(consigneeLogisticsDetail[8], logisticsState, 'Error: Missing or Invalid State of Logistics')
        assert.equal(consigneeLogisticsDetail[9], 0, 'Error: Missing or Invalid Current Transfer Station Message')
        assert.equal(consigneeLogisticsDetail[10], logisticsID, 'Error: Missing or Invalid LogisticsId')

        assert.equal(consignerLogisticsDetail[0], consigner, 'Error: Missing or Invalid Consigner Message')
        assert.equal(consignerLogisticsDetail[1], consignee, 'Error: Missing or Invalid Consignee Message')
        assert.equal(consignerLogisticsDetail[2], transportCompany, 'Error: Missing or Invalid Transport Company Message')
        assert.equal(consignerLogisticsDetail[3], productName, 'Error: Missing or Invalid Product Name')
        assert.equal(consignerLogisticsDetail[4], productCode, 'Error: Missing or Invalid Product Code')
        assert.equal(consignerLogisticsDetail[5], productPrice, 'Error: Missing or Invalid Product Price')
        assert.equal(consignerLogisticsDetail[6], productQuantity, 'Error: Missing or Invalid Product Quantity')
        //assert.equal(consignerLogisticsDetail[7].length === 0, 'Error: Missing or Invalid Transfer Stations Message')
        assert.equal(consignerLogisticsDetail[8], logisticsState, 'Error: Missing or Invalid State of Logistics')
        assert.equal(consignerLogisticsDetail[9], 0, 'Error: Missing or Invalid Current Transfer Station Message')
        assert.equal(consignerLogisticsDetail[10], logisticsID, 'Error: Missing or Invalid LogisticsId')
    })
    
    it("3. Testing smart contract function collectProductByTransportCompany() that allows transport company to collect the product", async() => {
        var eventEmitted = false

        logisticsChain.CollectedByTransportCompany()
        .on('data', (event) => {
            eventEmitted = true;
            //logisticsState = 4;
            console.log('CollectedByTransportCompany event:', event.returnValues);
        })
        .on('error', console.error);

        logisticsState = 4;

        await logisticsChain.collectProductByTransportCompany(logisticsID, { from: transportCompany })

        // check the change of logistics' state
        const consigneeLogisticsDetail = await logisticsChain.searchForLogisticsDetails.call(logisticsID, { from: consignee })
        
        assert.equal(consigneeLogisticsDetail[8], logisticsState, 'Error: Invalid State of Logistics')
    })

    it("4. Testing function transferProductByTransportCompany() that update transport route and begin to transfer", async () => {
        var eventEmitted = false

        logisticsChain.InTransit()
        .on('data', (event) => {
            eventEmitted = true;
            //logisticsState = 5;
            console.log('InTransit event:', event.returnValues);
        })
        .on('error', console.error);

        logisticsState = 5;

        await logisticsChain.transferProductByTransportCompany(logisticsID, stations, { from: transportCompany })

        const logisticsDetail = await logisticsChain.searchForLogisticsDetails.call(orderID, { from: consignee })

        assert.strictEqual(JSON.stringify(logisticsDetail[7]), JSON.stringify(stations), 'Error: Transport route update fail');
        assert.equal(logisticsDetail[8], logisticsState, 'Error: Invalid State of Logistics')
    })
    
    it("5. Testing function updateCurrentTransferStationByTransferStation that Product Transfer To TransferStation1", async () => {
        
        await logisticsChain.updateCurrentTransferStationByTransferStation(logisticsID, { from: transferStation1 })

        const logisticsDetail = await logisticsChain.searchForLogisticsDetails.call(logisticsID, { from: consignee })

        assert.equal(logisticsDetail[9], 1, 'Error: Missing or Invalid Current Transfer Station 1 Message')
    })

    it("6. Testing function updateCurrentTransferStationByTransferStation that Product Transfer To TransferStation2", async () => {

        await logisticsChain.updateCurrentTransferStationByTransferStation(logisticsID, { from: transferStation2 })

        const logisticsDetail = await logisticsChain.searchForLogisticsDetails.call(logisticsID, { from: consignee })

        assert.equal(logisticsDetail[9], 2, 'Error: Missing or Invalid Current Transfer 2 Station Message')
    })

    it("7. Testing function updateCurrentTransferStationByTransferStation that Product Transfer To TransferStation3", async () => {

        await logisticsChain.updateCurrentTransferStationByTransferStation(logisticsID, { from: transferStation3 })

        const logisticsDetail = await logisticsChain.searchForLogisticsDetails.call(logisticsID, { from: consignee })

        assert.equal(logisticsDetail[9], 3, 'Error: Missing or Invalid Current Transfer Station 3 Message')
    })

    it("8. Testing function arrivedProductByFinalTransferStation that Product arrived", async () => {
        var eventEmitted = false

        logisticsChain.Arrived()
        .on('data', (event) => {
            eventEmitted = true;
            //logisticsState = 6
            console.log('Arrived event:', event.returnValues);
        })
        .on('error', console.error);

        logisticsState = 6

        await logisticsChain.arrivedProductByFinalTransferStation(logisticsID, { from: transferStation3 })

        const logisticsDetail = await logisticsChain.searchForLogisticsDetails.call(logisticsID, { from: consignee })

        assert.equal(logisticsDetail[8], logisticsState, 'Error: Invalid State of Logistics')
    })

    it("9. Testing function orderFinishedByConsignee that Consignee finish the order", async () => {
        var eventEmitted = false

        logisticsChain.OrderFinished()
        .on('data', (event) => {
            eventEmitted = true;
            //orderState = 2
            console.log('OrderFinished event:', event.returnValues);
        })
        .on('error', console.error);

        orderState = 2

        await logisticsChain.orderFinishedByConsignee(orderID, { from: consignee })

        const returnOrderDetail = await logisticsChain.searchForOrderDetails.call(orderID, { from: consignee })

        assert.equal(returnOrderDetail[6], orderState, 'Error: Invalid State of order')
    })

});