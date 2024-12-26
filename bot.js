const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

const bot = mineflayer.createBot({
  host: 'x2nn.aternos.me', // Địa chỉ server
  port: 41493,                   // Cổng (mặc định là 25565)
  username: 'Namkunbg',       // Tên người dùng bot
});

bot.loadPlugin(pathfinder);

// Xử lý lệnh "!a mine {khối} {số lượng}"
bot.on('chat', (username, message) => {
  if (username === bot.username) return; // Bỏ qua tin nhắn của chính bot

  if (message.startsWith('!a mine')) {
    const args = message.split(' ');
    if (args.length < 3) {
      bot.chat('Cú pháp: !a mine {khối muốn đào} {số lượng tối đa}');
      return;
    }

    const blockName = args[2];
    const maxQuantity = parseInt(args[3]);

    if (isNaN(maxQuantity) || maxQuantity <= 0 || maxQuantity > 500) {
      bot.chat('Vui lòng nhập số lượng hợp lệ (1-500).');
      return;
    }

    bot.chat(`Bắt đầu tìm và đào ${maxQuantity} khối ${blockName}...`);
    mineBlocks(blockName, maxQuantity, username);
  }
});

// Hàm tìm và đào khối
async function mineBlocks(blockName, maxQuantity, playerName) {
  let collected = 0;

  while (collected < maxQuantity) {
    const targetBlock = bot.findBlock({
      matching: block => block && block.name === blockName,
      maxDistance: 64,
    });

    if (!targetBlock) {
      bot.chat(`Không tìm thấy khối ${blockName} nào gần đây.`);
      break;
    }

    const goal = new goals.GoalBlock(targetBlock.position.x, targetBlock.position.y, targetBlock.position.z);
    bot.pathfinder.setGoal(goal);

    try {
      await bot.dig(targetBlock);
      collected++;
      bot.chat(`Đã đào được ${collected}/${maxQuantity} khối ${blockName}.`);
    } catch (err) {
      bot.chat(`Lỗi khi đào: ${err.message}`);
      break;
    }
  }

  bot.chat(`Hoàn thành việc đào ${collected}/${maxQuantity} khối ${blockName}.`);
  returnItemsToPlayer(playerName);
}

// Hàm trả lại vật phẩm cho người chơi
function returnItemsToPlayer(playerName) {
  const player = bot.players[playerName]?.entity;

  if (!player) {
    bot.chat('Không tìm thấy người chơi để trả lại vật phẩm.');
    return;
  }

  const targetPosition = player.position.offset(0, 1, 0);
  bot.pathfinder.setGoal(new goals.GoalNear(targetPosition.x, targetPosition.y, targetPosition.z, 1));

  bot.on('goal_reached', () => {
    bot.chat('Đã đến gần người chơi. Trả lại vật phẩm...');

    const itemsToGive = bot.inventory.items().filter(item => item.name);
    itemsToGive.forEach(item => {
      bot.tossStack(item, (err) => {
        if (err) {
          bot.chat(`Lỗi khi trả vật phẩm: ${err.message}`);
        } else {
          bot.chat(`Đã trả ${item.count}x ${item.displayName}.`);
        }
      });
    });
  });
}

// Xử lý lỗi
bot.on('error', (err) => console.error(`Lỗi: ${err.message}`));
bot.on('end', () => console.log('Bot đã ngắt kết nối.'));
    
