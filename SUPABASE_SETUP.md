# Supabase 연결 방법

1. [Supabase](https://supabase.com/dashboard)에서 새 프로젝트를 만듭니다.
2. 프로젝트의 **SQL Editor**에서 [`supabase/schema.sql`](./supabase/schema.sql) 전체를 실행합니다.
3. **Connect** 화면에서 Project URL과 Publishable key를 복사합니다.
4. 프로젝트 루트에 `.env.local` 파일을 만들고 다음 값을 채웁니다.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=프로젝트_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=Publishable_key
   ```

5. Supabase **Authentication > URL Configuration**에서 Site URL을 개발 환경에서는 `http://localhost:3000`으로 설정하고, Redirect URLs에 `http://localhost:3000/auth/confirm`을 추가합니다. 배포 후에는 배포 주소와 `/auth/confirm` 주소도 추가합니다.
6. 이메일 가입 확인은 **Authentication > Email Templates > Confirm signup**의 기본 링크인 `{{ .ConfirmationURL }}`을 그대로 사용합니다. 별도의 링크 입력 칸이나 템플릿 수정은 필요하지 않습니다.

`schema.sql`의 RLS 정책은 로그인한 사용자가 자신의 `tasks` 행만 읽고, 만들고, 수정하고, 삭제하도록 강제합니다. 브라우저 코드가 다른 사용자의 ID를 전달해도 DB가 거부합니다. 확인 이메일의 기본 링크는 인증 뒤 `/auth/confirm`으로 돌아오고, 앱이 인증 코드를 세션으로 교환합니다.

