"""Shared API exceptions."""


class AppError(Exception):
    def __init__(self, detail: str, code: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.code = code
        self.status_code = status_code


class BadRequestError(AppError):
    def __init__(self, detail: str, code: str = "bad_request") -> None:
        super().__init__(detail=detail, code=code, status_code=400)


class NotFoundError(AppError):
    def __init__(self, detail: str, code: str = "not_found") -> None:
        super().__init__(detail=detail, code=code, status_code=404)


class UpstreamError(AppError):
    def __init__(self, detail: str, code: str = "upstream_error") -> None:
        super().__init__(detail=detail, code=code, status_code=502)
