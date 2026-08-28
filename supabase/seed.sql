insert into room_types (key, label, sort_order) values
  ('bedroom', '睡房', 1),
  ('living_room', '客廳', 2),
  ('kitchen', '廚房', 3),
  ('bathroom', '浴室', 4),
  ('dining_room', '飯廳', 5),
  ('study', '書房', 6),
  ('storage', '雜物房', 7),
  ('balcony', '露台', 8);

insert into furniture_types (name, icon_key) values
  ('床', 'bed'),
  ('衣櫃', 'cabinet'),
  ('床頭櫃', 'nightstand'),
  ('梳妝台', 'vanity'),
  ('書桌', 'desk'),
  ('書架', 'bookshelf'),
  ('沙發', 'sofa'),
  ('電視櫃', 'tv-stand'),
  ('茶几', 'coffee-table'),
  ('餐桌', 'dining-table'),
  ('雪櫃', 'fridge'),
  ('廚櫃', 'cabinet'),
  ('碗櫃', 'cabinet'),
  ('浴室櫃', 'cabinet'),
  ('鞋櫃', 'shoe-rack'),
  ('儲物箱', 'box'),
  ('層架', 'shelf');

insert into categories (name) values
  ('食品'),
  ('飲品'),
  ('清潔用品'),
  ('個人護理'),
  ('藥物'),
  ('文具'),
  ('電子產品'),
  ('衣物'),
  ('工具'),
  ('證件文件'),
  ('雜項');

-- Default furniture suggestions per room type.
insert into room_type_default_furniture (room_type_id, furniture_type_id)
select rt.id, ft.id
from room_types rt
join furniture_types ft on true
where (rt.key = 'bedroom'     and ft.name in ('床', '衣櫃', '床頭櫃', '梳妝台', '書桌'))
   or (rt.key = 'living_room' and ft.name in ('沙發', '電視櫃', '茶几', '書架'))
   or (rt.key = 'kitchen'     and ft.name in ('雪櫃', '廚櫃', '碗櫃'))
   or (rt.key = 'bathroom'    and ft.name in ('浴室櫃', '層架'))
   or (rt.key = 'dining_room' and ft.name in ('餐桌', '碗櫃'))
   or (rt.key = 'study'       and ft.name in ('書桌', '書架', '衣櫃'))
   or (rt.key = 'storage'     and ft.name in ('儲物箱', '層架', '鞋櫃'))
   or (rt.key = 'balcony'     and ft.name in ('層架', '儲物箱'));
