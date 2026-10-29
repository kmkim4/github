# 캘리그라피 홍보 블로그

정적 웹사이트입니다. `index.html`을 브라우저로 열면 바로 볼 수 있습니다.

## 내용 수정

- **작품 추가**: 이미지를 `images/works/`에 넣고 `js/data.js`의 `WORKS`에 항목을 추가합니다.
- **작업 노트**: `js/data.js`의 `POSTS`에 날짜, 제목, 링크(네이버 블로그 글 주소 등)를 추가합니다.
- **소개, 의뢰 안내, 작업실 이름**: `index.html`에서 직접 수정합니다.

## 네이버 블로그 RSS 자동 가져오기

`scripts/import-rss.mjs`가 `https://rss.blog.naver.com/spacewin.xml`을 읽어 `js/rss-data.js`를 만듭니다.
GitHub Actions가 배포할 때마다, 그리고 매일 아침 한 번 실행합니다.

- 이미지가 있는 글은 **작품** 갤러리에 들어갑니다. 카테고리는 블로그 카테고리를 그대로 씁니다.
- 모든 글은 **작업 노트**에 최신순으로 최대 10개까지 보입니다.
- 블로그 제목과 소개글은 사이트 이름과 첫 화면 소개 문구로 들어갑니다.

로컬에서 직접 실행하려면:

```bash
node scripts/import-rss.mjs
```

## 배포 (GitHub Pages)

`main` 브랜치에 푸시하면 `.github/workflows/pages.yml`이 `site/` 폴더를 배포합니다.
처음 한 번은 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정해야 합니다.
