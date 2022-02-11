# seat-map-sdk

## Docs

### Bus Events

#### `error` Event

Some of the method of the SDK will emit `error` event if any error occurs in the method.

The data returned in the error event has this schema:

```javascript
{
  error: {
    code: ErrorCode,
    msg: string
  }
}
```

You can import the enum ErrorCode from the sdk as following:

``` javascript
import { ErrorCode } from "seat-map-sdk";
```

Example of usage:

``` javascript
import { SeatMap, ErrorCode } from "seat-map-sdk";

// ... init seatMap

seatMap.onError = ({ error: { code, msg }}) => {
  console.error(msg);
  
  if(code === ErrorCode.SETSLCST) {
    // Error comes from setSelectedSeats
  }
};
```

This is the list of the methods that emit an error event:

* `setSelectedSeats`