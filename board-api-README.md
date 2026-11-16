# BOHYEON LAB 익명 게시판 서버

현재 상태: 서버 배포 및 코드 검증 완료. GITHUB_TOKEN 비밀 환경변수는 미설정이므로 글 등록은 아직 활성화되지 않았습니다.

- 홈페이지: https://bohyeon04.github.io/board.html
- 서버: https://bohyeon-lab-board-api.ovalgourd1.chatgpt.site
- POST /posts: 제목, 내용, 분류, 선택 이름을 받아 GitHub Issues에 저장
- GitHub 저장소: bohyeon04/bohyeon04.github.io
- 필요한 비밀 환경변수: GITHUB_TOKEN (선택 저장소 Issues 읽기·쓰기 권한)
- 키 만료일: 2027-02-14. 만료 전에 서버 비밀 환경변수 갱신 및 재배포가 필요합니다.

키를 HTML, JavaScript, GitHub 저장소 또는 도구 로그에 넣지 마세요. 서버의 비밀 환경변수로만 설정해야 합니다.

board-anonymous.html은 연결 준비용 화면입니다. 서버 비밀 환경변수를 설정하고 재배포한 뒤, 이 파일을 board.html로 반영해야 합니다. 현재 공개 board.html은 변경하지 않았습니다.

방문자는 로그인 없이 글만 작성합니다. 수정·삭제 API는 없습니다. 관리자는 GitHub에서 게시글을 관리할 수 있습니다. 저장되는 글은 공개이며 저장 계정 명의로 등록됩니다. 이름은 본문에 별도로 저장합니다. IP 주소는 GitHub에 저장하지 않습니다.

검증: node --test worker.test.mjs (3개 테스트 통과), node build.mjs.
입력 길이 검사, 외부 Origin 거부, 숨김 봇 필드, Worker 인스턴스별 1분 등록 제한이 있습니다. 인스턴스별 제한은 전역 스팸 차단을 보장하지 않습니다.
