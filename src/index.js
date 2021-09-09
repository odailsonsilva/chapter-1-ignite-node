const { response } = require('express')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

// inicializa o express
const app = express()


app.use(express.json())

const customers = []

// middlewares
function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers

    const customer = customers.find(cust => cust.cpf === cpf)

    if(!customer) {
        return response.status(400).json({ error: 'Customer not found' })
    }

    request.customer = customer

    return next()
}

function getBalence(statement) {
   const balance = statement.reduce((acc, extract) => {
        if(extract.type === 'credit') {
            return acc + extract.amount
        } else {
            return acc - extract.amount
        }
    }, 0)

    return balance
}

/*
* cpf - string 
* name - string 
* id - uuid
* statement [] = extrato
*/

app.post('/account', (req, res) => {
    const { cpf, name } = req.body
    // verifica se exite cpf
    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)

    if(customerAlreadyExists) {
        return res.status(400).json({ error: "Customer already exists!" })
    }
    
    const user = {
        cpf,
        name,
        id: uuidv4(),
        statement: []
    }
    
    customers.push(user)

    return res.status(201).json(user)
})

app.get('/statement', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req

    return res.json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF,(request, response) => {
    const { description, amount } = request.body

    const { customer } = request

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body
    const { customer } = request

    const balance = getBalence(customer.statement)

    if(balance < amount) {
        return response.status(400).json({ error: 'Insufficient funds!' })
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})

app.get('/statement/date', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req

    const { date } = req.query
    
    const dateFormat = new Date(date + ' 00:00')

    console.log('date', dateFormat)

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return res.json(statement)
})

app.put('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body
    // verifica se exite cpf
    const { customer } = req 

    customer.name = name
   
    return res.status(201).json(customer)
})

app.get('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req 
    
    return res.status(201).json(customer)
})

app.delete('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req 

    customers.splice(customer, 1)
    
    return res.status(200).json(customers)
})

app.get('/balance', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req 

    const balance = getBalence(customer.statement)
   
    return res.json({ balance })
})

// config para porta
app.listen(3333)