import { strict as assert } from "node:assert";
import { formatNavigationBadge } from "./navigation-badge.ts";

assert.equal(formatNavigationBadge(0), null);
assert.equal(formatNavigationBadge(1), "1");
assert.equal(formatNavigationBadge(100), "99+");
