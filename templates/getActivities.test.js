/* <% if (false) { %>
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
<% } %>
* <license header>
*/

jest.mock('@adobe/aio-sdk', () => ({
  Target: {
    init: jest.fn()
  },
  Core: {
    Logger: jest.fn()
  }
}))

const { Core, Target } = require('@adobe/aio-sdk')
const mockTargetInstance = { getActivities: jest.fn() }
const mockLoggerInstance = { info: jest.fn(), debug: jest.fn(), error: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)
Target.init.mockResolvedValue(mockTargetInstance)

const action = require('./<%= actionRelPath %>')

beforeEach(() => {
  Target.init.mockClear() // only clears calls stats
  mockTargetInstance.getActivities.mockReset() // clears calls + mock implementation

  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
  mockLoggerInstance.debug.mockReset()
  mockLoggerInstance.error.mockReset()
})

const fakeRequestParams = { tenant: 'fakeId', apiKey: 'fakeKey', __ow_headers: { authorization: 'Bearer fakeToken' } }
describe('<%= actionName %>', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })
  test('should set logger to use LOG_LEVEL param', async () => {
    await action.main({ ...fakeRequestParams, LOG_LEVEL: 'fakeLevel' })
    expect(Core.Logger).toHaveBeenCalledWith(expect.any(String), { level: 'fakeLevel' })
  })
  test('Target sdk should be initialized with input credentials', async () => {
    await action.main({ ...fakeRequestParams, otherParam: 'fake4' })
    expect(Target.init).toHaveBeenCalledWith('fakeId', 'fakeKey', 'fakeToken')
  })
  test('should return an http response with Target activities', async () => {
    const fakeResponse = { activities: 'fake' }
    mockTargetInstance.getActivities.mockResolvedValue(fakeResponse)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual({
      statusCode: 200,
      body: fakeResponse
    })
  })
  test('if there is an error should return a 500 and log the error', async () => {
    const fakeError = new Error('fake')
    mockTargetInstance.getActivities.mockRejectedValue(fakeError)
    const response = await action.main(fakeRequestParams)
    expect(response).toEqual({
      error: {
        statusCode: 500,
        body: { error: 'server error' }
      }
    })
    expect(mockLoggerInstance.error).toHaveBeenCalledWith(fakeError)
  })
  test('missing input request parameters, should return 400', async () => {
    const response = await action.main({})
    expect(response).toEqual({
      error: {
        statusCode: 400,
        body: { error: 'missing header(s) \'authorization\' and missing parameter(s) \'apiKey,tenant\'' }
      }
    })
  })
})
