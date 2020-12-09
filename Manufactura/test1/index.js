const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const WizardScene = require('telegraf/scenes/wizard')
const path = require('path')
// Database
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, '/database.sqlite')
    },
    useNullAsDefault: true
});
// Token-BOT
const TOKEN_API = '1446818729:AAEj8KyhrIZs-OoPoLxIMIwylxhbIj5FZps'
const bot = new Telegraf(TOKEN_API)
// Functions
async function checkIsUser(id){
  const select = await knex.where('user_id', id).select().from(['user_info'])
  if(select.length === 0){
    console.log('Пользователь не найден')
    return false;
  }  
  else { 
    console.log('Пользователь зарегистрирован ранее')
    return true;
  }
}

const priceList = {
  '23': '18 144 USD',
  '30': '23 976 USD',
  '45': 'от 40 824 USD  до 43 092 USD',
  '53': '47 385 USD',
  '58': '45 401 USD',
  '32': '37 146 USD',
  '47': '53 866 USD',
  '40': '45 713 USD',
  '60': '75 475 USD',
  '73': '83 858 USD',
  '79': '91 011 USD',
  '87': '99 679 USD',
  '240': '249 550 USD',
  '637': '668 850 USD',
  '627': '815 100 USD',
  '139': '181 324 USD',
  '198': '257 517 USD',
  '204': '265 161 USD',
  '280': '364 390 USD',
}
async function InsertInTable(data){
  await knex('user_info').insert({'user_id': data.id || '', 
                            'first_name': data.first_name || '',
                            'last_name': data.last_name || '',
                            'username': data.username || ''})
}
// END Functions

// Scene
const createScene = new WizardScene('Manufactura',
      async (ctx)=>{
        try {
          const userData = ctx.update.message.from
          console.log(userData, '\n')
          const isUser = await checkIsUser(userData.id)
          if (!isUser){
            await InsertInTable(userData)
          } 

          ctx.reply(`Привет, ${userData.first_name}. Я Бот IT-Park Manufactura`)
          ctx.reply('Выбери тип недвижимости', 
              Markup.keyboard([['Жилая', 'Коммерческая' ]]).oneTime().resize().extra())
          return ctx.wizard.next()
        } catch(err) {
          console.log(err)
        }
      },
      async (ctx)=>{
        try {
          const userData = ctx.update.message.from
          const type = ctx.message.text
          await knex('user_info').update({'type_realty': type}).where('user_id', userData.id);
          switch (type){
            case 'Жилая': 
              ctx.reply('Выбери площадь: ', Markup.keyboard([['23', '30', '45'],['53', '58', 'Назад']]).oneTime().resize().extra())
              break;
            case 'Коммерческая':
              ctx.reply('Выбери площадь: ', 
                Markup.keyboard([['32', '40', '47', '60', '73'],
                                  ['79', '87', '139', '198', '204'],
                                  ['240', '280', '627', '637', 'Назад']]).oneTime().resize().extra())
              break;
          }
          return ctx.wizard.next()
        } catch (error) {
          console.log(error)
        }
      },
      async (ctx)=>{
        try {
          const userData = ctx.update.message.from;
          if(ctx.message.text === 'Назад'){
            ctx.wizard.selectStep(0);
            return ctx.wizard.steps[0](ctx)
          } else {
            const square = ctx.message.text;
            await knex('user_info').update({'square': square}).where('user_id', userData.id);
            await ctx.replyWithDocument({source: path.join(__dirname, `/files/${square}.pdf`)})
            await knex('user_info').update({'isDownload': true}).where('user_id', userData.id);
            setTimeout(()=>{ctx.reply('Остались вопросы ?', Markup.keyboard(['Цена', 'Наличие', 'Форма оплаты', 'Узнать о скидке у менеджера', 'Вернуться назад', ]).oneTime().resize().extra())}, 500)
            return ctx.wizard.next();
          }
          
        } catch (error) {
          console.log(error)
        }
      },
      async (ctx)=>{
        try {
          const userData = ctx.update.message.from;
          const question = ctx.message.text;
          const selectPrice = await knex.where('user_id', userData.id).select('square').from(['user_info'])
          await knex('user_info').update({'question': question}).where('user_id', userData.id)
          switch (question){
            case 'Цена':
              await ctx.reply(`${priceList[selectPrice[0].square]}`)
              setTimeout(()=>{
                ctx.reply('Остались вопросы ?', Markup.keyboard(['Наличие', 'Форма оплаты', 'Узнать о скидке у менеджера', 'Вернуться назад']).oneTime().resize().extra())
              }, 700)
            break;
            case 'Наличие':
              await ctx.reply(`Апартаменты в наличии`)
              setTimeout(()=>{
                ctx.reply('Остались вопросы ?', Markup.keyboard(['Цена', 'Форма оплаты', 'Узнать о скидке у менеджера', 'Вернуться назад' ]).oneTime().resize().extra())
              }, 700)
            break;
            case 'Форма оплаты':
              await ctx.replyWithMarkdown(`
              *100 % оплата*

    _*при полной оплате вы экономите 10 USD на каждом квадратном метре только до 31.12.2020_`)
              await ctx.replyWithMarkdown(`
              *Бепроцентная рассрочка от застройщика*
              
    - *Апартаменты:* _50%_ - первоначальный взнос / _50%_ на *8 мес*.
    - *Офис:* первоначальный взнос _40%_/ _60%_ на *7 мес*.
    - *Торговая площадь:* первоначальный взнос - _50%_/ _50%_ на *10 мес* равными платежами
    `)
            setTimeout(()=>{
              ctx.reply('Остались вопросы ?', Markup.keyboard(['Цена', 'Форма оплаты', 'Узнать о скидке у менеджера', 'Вернуться назад' ]).oneTime().resize().extra())
            }, 700)
            break;
            case 'Вернуться назад':
              ctx.wizard.selectStep(0);
              return ctx.wizard.steps[0](ctx)
            case 'Узнать о скидке у менеджера':
              ctx.replyWithMarkdown(`
              *Напиши свой номер телефона, а я свяжу тебя со специалистом.*
_* тел. в формате 3809669903111_`)
              return ctx.wizard.next();
              break;
          }
        } catch (error) {
          console.log(error)
        }
      },
      async (ctx)=>{
        try {
          console.log('THIES')
          const userData = ctx.update.message.from;
          const phone_number = ctx.update.message.text;
          await knex('user_info').update({'phone_number': phone_number}).where('user_id', userData.id)
          ctx.reply('Спасибо. Ваш запрос принят. Личный менеджер свяжется с тобой. Рад Был помочь.', Markup.keyboard(['Вернутсься к истокам']).oneTime().resize().extra())
          return ctx.wizard.next();
        } catch (error) {
          console.log(error)
        }
      },
      async (ctx)=>{
        ctx.wizard.selectStep(0);
        return ctx.wizard.steps[0](ctx)
      }
)

const stage = new Stage();
stage.register(createScene);

bot.use(session())
bot.use(stage.middleware())

bot.start( async (ctx)=>{
  await ctx.scene.enter('Manufactura')
})


bot.launch().then(res=>{
  console.log('Starting bot Manufactura')
}).catch(err=>{
  console.log(err)
})