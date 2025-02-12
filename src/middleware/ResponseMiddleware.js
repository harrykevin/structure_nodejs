function responseMiddleware(req, res, next) {
  res.sendResponse = (errorCode, status, message, data) => {
    res.status(errorCode).json({
      status,
      message,
      data,
    });
  };

  res.success = (message = "Success", data = null) => {
    res.status(200).json({
      status: true,
      message,
      data,
    });
  };

  res.error = (message = "Error occurred", errorCode = 400) => {
    res.status(errorCode).json({
      status: false,
      message,
      data: null,
    });
  };

  res.collection = (models, transformer) => {
    const transformedData = models.map((model) => transformer(model));
    res.success("Data retrieved successfully", transformedData);
  };

  res.item = (model, transformer) => {
    const transformedData = transformer(model);
    res.success("Data retrieved successfully", transformedData);
  };

  next();
}

export default responseMiddleware;
