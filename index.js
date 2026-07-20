require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let recordsCollection;

async function connectDB() {
  await client.connect();
    const db = client.db("prolificNexus");
      recordsCollection = db.collection("records");
        console.log("Connected to MongoDB");
        }
        connectDB();

        app.use(express.urlencoded({ extended: false }));

        app.get('/', (req, res) => {
          res.send('Prolific Nexus bot server is running!');
          });

          function getStartOfToday() {
            const d = new Date();
              d.setHours(0, 0, 0, 0);
                return d;
                }

                function getStartOfWeek() {
                  const d = new Date();
                    const day = d.getDay();
                      const diff = d.getDate() - day;
                        d.setDate(diff);
                          d.setHours(0, 0, 0, 0);
                            return d;
                            }

                            async function buildSummary(records) {
                              const totalSales = records.filter(r => r.type === 'sale').reduce((sum, r) => sum + r.amount, 0);
                                const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
                                  const profit = totalSales - totalExpenses;
                                    return 'Sales: N' + totalSales + ', Expenses: N' + totalExpenses + ', Profit: N' + profit;
                                    }

                                    app.post('/whatsapp', async (req, res) => {
                                      const msg = req.body.Body.trim();
                                        const lowerMsg = msg.toLowerCase();
                                          let reply = '';

                                            if (lowerMsg.startsWith('log sale')) {
                                                const parts = msg.split(' ');
                                                    const amount = parseFloat(parts[2]);
                                                        const description = parts.slice(3).join(' ') || 'No description';

                                                            if (isNaN(amount)) {
                                                                  reply = 'Please use format: log sale [amount] [description]';
                                                                      } else {
                                                                            await recordsCollection.insertOne({ type: 'sale', amount, description, date: new Date() });
                                                                                  reply = 'Sale logged: N' + amount + ' - ' + description;
                                                                                      }

                                                                                        } else if (lowerMsg.startsWith('log expense')) {
                                                                                            const parts = msg.split(' ');
                                                                                                const amount = parseFloat(parts[2]);
                                                                                                    const description = parts.slice(3).join(' ') || 'No description';

                                                                                                        if (isNaN(amount)) {
                                                                                                              reply = 'Please use format: log expense [amount] [description]';
                                                                                                                  } else {
                                                                                                                        await recordsCollection.insertOne({ type: 'expense', amount, description, date: new Date() });
                                                                                                                              reply = 'Expense logged: N' + amount + ' - ' + description;
                                                                                                                                  }

                                                                                                                                    } else if (lowerMsg === 'summary' || lowerMsg === 'summary all') {
                                                                                                                                        const records = await recordsCollection.find({}).toArray();
                                                                                                                                            reply = 'All-time Summary - ' + await buildSummary(records);

                                                                                                                                              } else if (lowerMsg === 'summary today') {
                                                                                                                                                  const records = await recordsCollection.find({ date: { $gte: getStartOfToday() } }).toArray();
                                                                                                                                                      reply = 'Today Summary - ' + await buildSummary(records);

                                                                                                                                                        } else if (lowerMsg === 'summary week' || lowerMsg === 'summary this week') {
                                                                                                                                                            const records = await recordsCollection.find({ date: { $gte: getStartOfWeek() } }).toArray();
                                                                                                                                                                reply = 'This Week Summary - ' + await buildSummary(records);

                                                                                                                                                                  } else if (lowerMsg === 'delete last') {
                                                                                                                                                                      const last = await recordsCollection.find({}).sort({ date: -1 }).limit(1).toArray();
                                                                                                                                                                          if (last.length === 0) {
                                                                                                                                                                                reply = 'No records to delete.';
                                                                                                                                                                                    } else {
                                                                                                                                                                                          await recordsCollection.deleteOne({ _id: last[0]._id });
                                                                                                                                                                                                reply = 'Deleted last entry: N' + last[0].amount + ' - ' + last[0].description;
                                                                                                                                                                                                    }

                                                                                                                                                                                                      } else if (lowerMsg === 'help') {
                                                                                                                                                                                                          reply = 'Commands:\nlog sale [amount] [description]\nlog expense [amount] [description]\nsummary\nsummary today\nsummary week\ndelete last';

                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                reply = "Sorry, I didn't understand that. Type help to see commands.";
                                                                                                                                                                                                                  }

                                                                                                                                                                                                                    console.log('Message received:', msg);

                                                                                                                                                                                                                      res.set('Content-Type', 'text/xml');
                                                                                                                                                                                                                        res.send('<Response><Message>' + reply + '</Message></Response>');
                                                                                                                                                                                                                        });

                                                                                                                                                                                                                        app.listen(PORT, () => {
                                                                                                                                                                                                                          console.log('Server running on http://localhost:' + PORT);
                                                                                                                                                                                                                          });