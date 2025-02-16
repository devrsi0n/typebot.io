import test, { expect } from '@playwright/test'
import {
  createSmtpCredentials,
  importTypebotInDatabase,
} from '../services/database'
import cuid from 'cuid'
import path from 'path'
import { typebotViewer } from '../services/selectorUtils'
import { SmtpCredentialsData } from 'models'

const mockSmtpCredentials: SmtpCredentialsData = {
  from: {
    email: 'kimberly.boyer36@ethereal.email',
    name: 'Kimberly Boyer',
  },
  host: 'smtp.ethereal.email',
  port: 587,
  username: 'kimberly.boyer36@ethereal.email',
  password: '4jvjGUgxYKRjbk15tW',
}

test('should send an email', async ({ page }) => {
  const typebotId = cuid()
  const credentialsId = 'send-email-credentials'
  await createSmtpCredentials(credentialsId, mockSmtpCredentials)
  await importTypebotInDatabase(
    path.join(__dirname, '../fixtures/typebots/sendEmail.json'),
    { id: typebotId, publicId: `${typebotId}-public` }
  )
  await page.goto(`/${typebotId}-public`)
  await typebotViewer(page).locator('text=Send email').click()
  const response = await page.waitForResponse((resp) =>
    resp.request().url().includes(`integrations/email`)
  )
  const { previewUrl } = await response.json()
  await page.goto(previewUrl)
  await expect(page.locator('text="Hey!"')).toBeVisible()
  await expect(page.locator('text="Kimberly Boyer"')).toBeVisible()
  await expect(page.locator('text="<test1@gmail.com>" >> nth=0')).toBeVisible()
  await expect(page.locator('text="<test2@gmail.com>" >> nth=0')).toBeVisible()
  await expect(
    page.locator('text="<baptiste.arnaud95@gmail.com>" >> nth=0')
  ).toBeVisible()
  await page.goto(`${process.env.BUILDER_URL}/typebots/${typebotId}/results`)
  await page.click('text="See logs"')
  await expect(page.locator('text="Email successfully sent"')).toBeVisible()
})
