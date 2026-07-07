# lotto-data

로또 회차별 당첨번호 정적 JSON — [육룡이 나르샷] 미니앱의 당첨확인용 데이터.

- `data/lotto-results.json` — 회차 누적 결과 (`{"rounds":[{"r":회차,"d":"날짜","n":[번호6],"b":보너스}]}`)
- GitHub Actions가 매주 토요일 추첨 후 자동 갱신 (`.github/workflows/lotto-results.yml`)
- 소스: smok95/lotto 커뮤니티 미러 (동행복권 공식 API는 봇 차단)

앱은 raw.githubusercontent.com 으로 이 파일을 읽는다.
