import {expect, Page, test} from '@playwright/test';
import { login } from './utils/roles';
import {openChat} from "./utils/menu";
import {findContainer, startContainer, stopContainer} from "./utils/containers";

const TIMEOUT_TO_GET_LIST = 30_000;

test.setTimeout(120_000);

test.describe('Chat', () => {
  test('main test', async ({ page, browser }) => {
    await page.goto(
        'http://play.workadventure.localhost/_/global/maps.workadventure.localhost/tests/E2E/livezone.json'
    );
    const nickname = getUniqueNickname('A');
    await login(page, nickname, 2);
    await openChat(page);
    const chat = await getChat(page);
    const ejabberd = await findContainer('ejabberd');

    await test.step('should connect to ejabberd and show list of users', async () => {

      await expect(chat).toBeDefined();

      await expect(chat.locator('#users')).toBeDefined();

      await chat.locator('#users').highlight();

      await page.waitForTimeout(5_000);

      console.log(await chat.textContent());

      await expect(chat.locator('#users')).toContainText(nickname, {
        timeout: TIMEOUT_TO_GET_LIST
      });

      const newBrowser = await browser.browserType().launch();
      const page2 = await newBrowser.newPage();

      await page2.goto(
          'http://play.workadventure.localhost/_/global/maps.workadventure.localhost/tests/E2E/livezone.json'
      );
      const nickname2 = getUniqueNickname('B');
      await login(page2, nickname2, 3);

      await openChat(page2);
      const chat2 = await getChat(page2);

      await expect(chat2.locator('#users')).toContainText(nickname);
      await expect(chat2.locator('#users')).toContainText(nickname2);

      await page2.close();
    });


    await test.step('enter and exit from live zone', async () => {
      const chat = await getChat(page);
      await expect(chat.locator('#users')).toContainText(nickname, {
        timeout: TIMEOUT_TO_GET_LIST
      });

      await page.locator('#game').focus();

      await page.keyboard.press('ArrowRight', {delay: 2_500});
      await expect(chat.locator('#liveRooms')).toContainText('liveZone');

      await page.keyboard.press('ArrowLeft', {delay: 1_500});
      // FIXME This expect is not working IDK why
      //await expect(chat.locator('#liveRooms')).not.toContainText('liveZone');
    });

    await test.step('disconnect and reconnect to ejabberd and pusher', async () => {
      await expect(chat.locator('#users')).toContainText(nickname, {
        timeout: TIMEOUT_TO_GET_LIST
      });

      await stopContainer(ejabberd);
      await expect(chat).toContainText("Connection to presence server");
      await startContainer(ejabberd);
      await expect(chat.locator('#users')).toContainText(nickname, {
        timeout: TIMEOUT_TO_GET_LIST
      });

      const pusher = await findContainer('pusher');
      await stopContainer(pusher);
      await expect(page.locator('.errorScreen p.code')).toContainText('CONNECTION_');

      await startContainer(pusher);
      //await openChat(page);
      await expect(chat.locator('#users')).toContainText(nickname, {
        timeout: TIMEOUT_TO_GET_LIST
      });
    });
  });

  /*test('should connect to ejabberd and show list of users', async ({ page, browser }) => {
    await page.goto(
      'http://play.workadventure.localhost/_/global/maps.workadventure.localhost/tests/E2E/empty.json'
    );
    const nickname = getUniqueNickname('A');
    await login(page, nickname, 2);

    await openChat(page);
    const chat = await getChat(page);

    await expect(chat.locator('#users')).toContainText(nickname, {
      timeout: 10_000
    });

    const newBrowser = await browser.browserType().launch();
    const page2 = await newBrowser.newPage();

    await page2.goto(
        'http://play.workadventure.localhost/_/global/maps.workadventure.localhost/tests/E2E/empty.json'
    );
    const nickname2 = getUniqueNickname('B');
    await login(page2, nickname2, 3);

    await openChat(page2);
    const chat2 = await getChat(page2);

    await expect(chat2.locator('#users')).toContainText(nickname);
    await expect(chat2.locator('#users')).toContainText(nickname2);

    await page2.close();
  });

  test('enter and exit from live zone', async ({ page }) => {
    await page.goto(
        'http://play.workadventure.localhost/_/global/maps.workadventure.localhost/tests/E2E/livezone.json'
    );
    const nickname = getUniqueNickname('A');
    await login(page, nickname, 3);

    await openChat(page);
    const chat = await getChat(page);
    await expect(chat.locator('#users')).toContainText(nickname, {
      timeout: 10_000
    });

    await page.locator('#game').focus();

    await page.keyboard.press('ArrowRight', {delay: 2_500});
    await expect(chat.locator('#liveRooms')).toContainText('liveZone');

    await page.keyboard.press('ArrowLeft', {delay: 1_500});
    // FIXME This expect is not working IDK why
    //await expect(chat.locator('#liveRooms')).not.toContainText('liveZone');
  });

  test('disconnect and reconnect to ejabberd and pusher', async ({ page }) => {

    const ejabberd = await findContainer('ejabberd');

    await page.goto(
        'http://play.workadventure.localhost/_/global/maps.workadventure.localhost/tests/E2E/empty.json'
    );
    const nickname = getUniqueNickname('A');
    await login(page, nickname, 3);

    await openChat(page);
    let chat = await getChat(page);
    await expect(chat.locator('#users')).toContainText(nickname, {
      timeout: 30_000
    });

    await stopContainer(ejabberd);
    await expect(chat).toContainText("Connection to presence server");
    await startContainer(ejabberd);
    await expect(chat.locator('#users')).toContainText(nickname, {
      timeout: 10_000
    });

    const pusher = await findContainer('pusher');
    await stopContainer(pusher);
    await expect(page.locator('.errorScreen p.code')).toContainText('CONNECTION_');

    await startContainer(pusher);
    await openChat(page);
    chat = await getChat(page);
    await expect(chat.locator('#users')).toContainText(nickname, {
      timeout: 30_000
    });
  });*/
});

async function getChat(page: Page){
  return page.frameLocator('iframe#chatWorkAdventure').locator('aside.chatWindow');
}

function getUniqueNickname(name: string){
  return `${name}_${Date.now().toString().split("").reverse().join("")}`.substring(0, 8);
}
