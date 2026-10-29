# 글씨상점 블로그 포트폴리오

정적 웹사이트입니다. 디자인은 www.lettershop.xyz 를 따릅니다.

## 내용 수정

- **링크** (블로그, 네이버 폼 요청서, 카카오톡 오픈채팅): `js/data.js`의 `SITE`
- **블로그에 없는 작품 추가**: 이미지를 `images/works/`에 넣고 `js/data.js`의 `WORKS`에 항목 추가
- **문구**: `index.html`에서 직접 수정

## 네이버 블로그 RSS 자동 가져오기

`scripts/import-rss.mjs`가 `https://rss.blog.naver.com/spacewin.xml`을 읽어 `js/rss-data.js`를 만들고,
글마다 대표 이미지를 큰 크기로 내려받아 `images/rss/`에 저장합니다(저장소에는 올리지 않고 배포 때만 만듭니다).
GitHub Actions가 배포할 때마다, 그리고 매일 아침 한 번 실행합니다.

- 제목은 블로그 제목에서 따옴표 안 문구나 `｜` 뒤 문구를 씁니다. 예: `[56] ... | "인연을 맺는 날" ...` → `인연을 맺는 날`
- 이미지가 있는 글은 작업 목록에 들어가고, 블로그 카테고리가 분류 버튼이 됩니다.
- `[작업 의뢰 안내]`처럼 번호 대신 머리말이 붙은 글은 공지로 보고 목록에서 빼며, 요청서 영역에 링크로 넣습니다.
- 가져오기에 실패하면 직전 데이터로 배포합니다.

## 배포 (GitHub Pages)

`main` 브랜치에 푸시하면 `.github/workflows/pages.yml`이 `site/` 폴더를 배포합니다.
Actions 탭에서 **Run workflow**로 바로 다시 배포할 수도 있습니다.
