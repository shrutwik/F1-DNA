"""Simple process-local TTL cache."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Any


@dataclass
class _Entry:
    value: Any
    expires_at: float


class TTLCache:
    def __init__(self) -> None:
        self._store: dict[str, _Entry] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> tuple[bool, Any]:
        now = time.time()
        with self._lock:
            item = self._store.get(key)
            if item is None:
                return False, None
            if item.expires_at <= now:
                self._store.pop(key, None)
                return False, None
            return True, item.value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        with self._lock:
            self._store[key] = _Entry(value=value, expires_at=time.time() + ttl_seconds)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


cache = TTLCache()
