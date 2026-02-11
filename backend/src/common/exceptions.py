"""Custom exceptions for image processing pipeline."""


class ProcessingError(Exception):
    """Exception that can specify custom error code and status for API responses."""

    def __init__(
        self, message: str, status_code: int = 500, error_code: str = "PROCESSING_ERROR"
    ):
        """
        Initialize a processing error.

        Args:
            message: Error message
            status_code: HTTP status code (default: 500)
            error_code: Application-specific error code (default: "PROCESSING_ERROR")
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
