-- Blog approval gate.
--
-- Blog posts can no longer be published directly — they must be submitted for
-- review and approved first. This adds the review state + reviewer trail to
-- blog_posts. Enforcement lives in the API (see /api/admin/blog routes):
-- `published` may only become true when review_status = 'approved'.

alter table blog_posts
  add column if not exists review_status text not null default 'draft'
    check (review_status in ('draft', 'pending', 'approved', 'rejected'));

alter table blog_posts add column if not exists submitted_by      text;
alter table blog_posts add column if not exists submitted_at      timestamptz;
alter table blog_posts add column if not exists reviewed_by       text;
alter table blog_posts add column if not exists reviewed_at       timestamptz;
alter table blog_posts add column if not exists rejection_reason  text;

comment on column blog_posts.review_status is
  'Approval gate: draft → pending → approved/rejected. Publishing requires approved.';

-- Grandfather existing live posts so editing them isn''t blocked by the gate.
update blog_posts set review_status = 'approved' where published = true and review_status = 'draft';

create index if not exists blog_posts_review_status_idx on blog_posts(review_status);
