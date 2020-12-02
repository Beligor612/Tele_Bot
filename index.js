const Telegraf = require('telegraf')
const { Keyboard, Key } = require('telegram-keyboard')
// const sqlite3 = require('sqlite3').verbose();
const opn = require('opn')

const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: "D:/NodeTeleBot/database.sqlite"
  },
  useNullAsDefault: true
});


const { callback } = Key
let stage = 0;
const bot = new Telegraf('')
const mainMenuKeyboard = Keyboard.make([
    ['Жилая', 'Коммерческая' ],
]).reply()

const MenuWithMetrs = Keyboard.make([
  ['23', '30', '45', '58', 'Назад']
]).reply()

const MenuWithMetrs2 = Keyboard.make([
    '32', '40', '47', '60', '73', '79', '87',
    '139', '198', '204', '240', '280', '627', '637', 'Назад'
], {
  columns: 3,
}).reply()

const Back = Keyboard.make([
    ['Назад']
]).reply()

const Questions = Keyboard.make(['Цена', 'Наличие', 'Рассрочка', 'Форма оплаты', 'Вернуться назад'], {
  columns: 1,
}).reply()
const text = `Введенням номеру телефону Ви відповідно до Закону України "Про захист персональних даних" надаєте однозначну беззастережну згоду (дозвіл) на обробку персональних даних у електронній формі, а також підтверджуєте, що отримали повідомлення про включення персональних даних до бази персональних даних, та що повідомлені про свої права, як суб’єкта персональних даних, які визначені в ст. 8 Закону України "Про захист персональних даних", а також мету збору цих даних та осіб, яким ці дані передаються. Ми зобов’язуємося забезпечувати виконання вимог Закону України "Про захист персональних даних", включаючи забезпечення режиму захисту персональних даних від незаконної обробки та незаконного доступу до них третіх осіб, а також забезпечувати дотримання прав суб’єкта персональних даних згідно з вимогами цього закону.`
const keyboard = Keyboard.make([
                [callback('Открыть', `https://manufactura.kh.ua/#politicModal`)],
            ]).inline()
bot.start(async ({ reply, update }) => {
        const name = update.message.from.first_name
        const userId = update.message.from.id
        const select = await knex.where('user_id', userId).select().from(['user_info'])
        if(select.length === 0){
            const insert = await knex('user_info').insert({'user_id': update.message.from.id || '', 
                                                            'first_name': update.message.from.first_name || '',
                                                            'last_name': update.message.from.last_name || '',
                                                            'username': update.message.from.username || ''})
        }
        console.log("START", update.message.from, update.message.from.first_name)
        stage = 1;
        reply(`Привет, ${name}. Я Бот IT-Park Manufactura`)
        return reply('Выбери тип недвижимости', mainMenuKeyboard) })

bot.hears('Жилая', async ({ reply, update }) => {
    const insert = await knex('user_info').update({'type_realty': 'Жилая'}).where('user_id', update.message.from.id);
    stage = 2;
    console.log("TypeRealtyH: ", update.message.from.username, update.message.from.first_name)
    return reply('Выбери площадь', MenuWithMetrs)
})
        bot.hears(['23', '30', '45', '58'], async ({ reply, update }) => {
            const insert = await knex('user_info').update({'square': update.message.text}).where('user_id', update.message.from.id)
            stage = 4;
            console.log("Square: ", update.message.from.username, update.message.from.first_name)
            const select = await knex.where('user_id', update.message.from.id).select('phone_number').from(['user_info'])
            console.log('Phone Select: ',select[0]['phone_number'])
            if (select[0]['phone_number'] === null){
                await reply('Введите свой номер телефона и я отправлю планировку. Формат номера 380966903111', Back)
                // await reply('Политика конфиденциальности',{reply_markup:{inline_keyboard:[[{text:'Перейти', url:'https://manufactura.kh.ua/#politicModal'}]]}})
                await reply('Политика конфиденциальности', keyboard)
            }
            else {
                return reply('Скачать планировку', Keyboard.make(['Скачать планировку']).reply())
            }
        })
        

bot.hears('Коммерческая', async ({ reply, update }) => {
    stage = 3;
    console.log("TypeRealtyK: ", update.message.from.username, update.message.from.first_name)
    const insert = await knex('user_info').update({'type_realty': 'Коммерческая'}).where('user_id', update.message.from.id)
    return reply('Выбери площадь', MenuWithMetrs2)
})
        bot.hears(['32', '40', '47', '60', '73', '79', '87',
                    '139', '198', '204', '240', '280', '627', '637'], 
                    async ({ reply, update}) => {
                        stage = 5;
                        console.log("Square: ", update.message.from.username, update.message.from.first_name)
                        const insert = await knex('user_info').update({'square': update.message.text}).where('user_id', update.message.from.id)
                        const select = await knex.where('user_id', update.message.from.id).select('phone_number').from(['user_info'])
                        if (select[0] === undefined || select[0]['phone_number'] === null){
                            await reply('Введите свой номер телефона и я отправлю планировку. Формат номера 380966903111', Back)
                            // await reply('Политика конфиденциальности',{reply_markup:{inline_keyboard:[[{text:'Перейти', url:'https://manufactura.kh.ua/#politicModal'}]]}})
                            await reply('Политика конфиденциальности', keyboard)
                        }
                        else {
                            return reply('Скачать планировку', Keyboard.make(['Скачать планировку']).reply())}
                    })
bot.hears([/^(380)\d{9}$/, /^(380)(\d{2})-{\d{3}}-{\d{2}}-{\d{2}}$/, /^\d{10}$/], async ({reply, update })=>{
    console.log("Phone_number: ", update.message.from.username, update.message.from.first_name)
    const insert = await knex('user_info').update({'phone_number': update.message.text}).where('user_id', update.message.from.id)
    return reply('Скачать планировку', Keyboard.make(['Скачать планировку']).reply())
})

bot.on('callback_query', (ctx) => {
    ctx.reply(text)
})

bot.hears('Скачать планировку', async ({reply, replyWithDocument, update})=>{
    const select = await knex.where('user_id', update.message.from.id).select('square').from(['user_info'])
    console.log("isDownload: ", update.message.from.username, update.message.from.first_name)
    replyWithDocument({source: `D:/NodeTeleBot/files/${select[0].square}.pdf`})
    const insert = await knex('user_info').update({'isDownload': true}).where('user_id', update.message.from.id)
    reply('Отправляю файл...')
    stage = 6;
    setTimeout(function() {
        reply('Остались вопросы ?', Questions)
    }, 1000);
})

bot.hears(['Цена', 'Наличие', 'Рассрочка', 'Форма оплаты'], async ({ reply, update }) => {
    stage = 6;
    console.log("Question: ", update.message.from.username, update.message.from.first_name)
    const insert = await knex('user_info').update({'question': update.message.text}).where('user_id', update.message.from.id)
    return reply('Спасибо. Ваш запрос принят. Личный менеджер свяжется с Вами. Рад был помочь', Keyboard.make(['Назад']).reply())
})

bot.hears(['Назад', 'Вернуться назад'], ({reply}) => {
    console.log('stage ' , stage)
    switch(stage){
        case 1:
            stage = 1;
            reply('Выбери тип недвижимости', mainMenuKeyboard);
            break;
        case 2: 
            stage = 1;
            reply('Выбери тип недвижимости', mainMenuKeyboard);
            break;
        case 3:
            stage = 1;
            reply('Выбери тип недвижимости', mainMenuKeyboard);
            break;
        case 4:
            stage = 2;
            return reply('Выбери площадь', MenuWithMetrs);
            break;
        case 5:
            stage = 2;
            return reply('Выбери площадь', MenuWithMetrs2);
            break;
        case 6:
            stage = 1;
            reply('Выбери тип недвижимости', mainMenuKeyboard);
            break;
    }
})

bot.startPolling()