import { ApiResponse } from '@nestjs/swagger';

class Dummy {
  @ApiResponse({
    status: 200,
    description: 'CSV',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  test() {}
}
