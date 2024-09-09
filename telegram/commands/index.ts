import { help } from './help';
import { start } from './start';
import { list } from './list';
import { track } from './track';
import { untrack } from './untrack';
import { bulkImport } from './bulkImport';
import { status } from './status';
import { requestAccess } from './requestAccess';
import { defaultCommand } from './default';
import { on } from './on';
import { off } from './off';

export const commands = {
  '/help': help,
  '/start': start,
  '/list': list,
  '/track': track,
  '/untrack': untrack,
  '/bulk_import': bulkImport,
  '/on': on,
  'off': off,
  '/status': status,
  '/request_access': requestAccess,
  'default': defaultCommand
};

