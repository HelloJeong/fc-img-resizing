# Image Resizing

_Fastcampus Node 이미지 리사이징 서버 만들기 강의 내용을 정리해둔 자료입니다._

## Unsplash API(`unsplash-js, node-fetch`)

- `node-fetch` version 확인. (2.x로 할 것, 3.x에서는 현재 코드가 동작 안함)
- accessKey를 `src/key.ts` 에 `export default`로 추가
- node-fetch로 받은 데이터의 body는 stream.
  - `resp.body.pipe(res)`를해서 서버측에서 다운로드 없이 이미지를 내려주기 가능

## Sharp

- `resize()`의 3번째 파라미터 option
  - fit으로 contain, cover, fill 설정 가능
  - background도 설정 가능

## image-size
