/**
 * Global test setup: silence the Nest logger so debug/log output does not clutter
 * test runs and so logger calls on circular objects never throw.
 */
import { Logger } from '@nestjs/common';

Logger.overrideLogger(false);
