-- public.customers definition

-- Drop table

-- DROP TABLE public.customers;

CREATE TABLE public.customers (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	phone varchar(20) NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_customers_created_at ON public.customers USING btree (created_at DESC);
CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);

-- Table Triggers

create trigger update_customers_updated_at before
update
    on
    public.customers for each row execute function update_updated_at_column();


-- public.pet_type_configs definition

-- Drop table

-- DROP TABLE public.pet_type_configs;

CREATE TABLE public.pet_type_configs (
	id varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	icon varchar(50) NULL,
	order_index int4 NOT NULL,
	active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT pet_type_configs_pkey PRIMARY KEY (id),
	CONSTRAINT unique_pet_type_order_index UNIQUE (order_index)
);
CREATE INDEX idx_pet_type_configs_active ON public.pet_type_configs USING btree (active);

-- Table Triggers

create trigger update_pet_type_configs_updated_at before
update
    on
    public.pet_type_configs for each row execute function update_updated_at_column();


-- public.products definition

-- Drop table

-- DROP TABLE public.products;

CREATE TABLE public.products (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	sku varchar(100) NULL,
	description text NULL,
	category varchar(100) NULL,
	price numeric(10, 2) DEFAULT 0 NOT NULL,
	"cost" numeric(10, 2) DEFAULT 0 NOT NULL,
	stock_quantity int4 DEFAULT 0 NOT NULL,
	min_stock int4 DEFAULT 0 NOT NULL,
	unit varchar(50) DEFAULT 'ชิ้น'::character varying NOT NULL,
	active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT products_pkey PRIMARY KEY (id),
	CONSTRAINT products_sku_key UNIQUE (sku)
);
CREATE INDEX idx_products_active ON public.products USING btree (active);
CREATE INDEX idx_products_category ON public.products USING btree (category);
CREATE INDEX idx_products_sku ON public.products USING btree (sku);

-- Table Triggers

create trigger trigger_products_updated_at before
update
    on
    public.products for each row execute function update_products_updated_at();


-- public.promotions definition

-- Drop table

-- DROP TABLE public.promotions;

CREATE TABLE public.promotions (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	value numeric(10, 2) NOT NULL,
	applicable_to varchar(20) DEFAULT 'ALL'::character varying NOT NULL,
	active bool DEFAULT true NOT NULL,
	start_date date NULL,
	end_date date NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT check_applicable_to CHECK (((applicable_to)::text = ANY ((ARRAY['ALL'::character varying, 'SERVICE'::character varying, 'HOTEL'::character varying, 'PRODUCT'::character varying])::text[]))),
	CONSTRAINT check_promotion_type CHECK (((type)::text = ANY ((ARRAY['PERCENT'::character varying, 'AMOUNT'::character varying])::text[]))),
	CONSTRAINT promotions_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_promotions_active ON public.promotions USING btree (active);
CREATE INDEX idx_promotions_applicable_to ON public.promotions USING btree (applicable_to);
CREATE INDEX idx_promotions_dates ON public.promotions USING btree (start_date, end_date);

-- Table Triggers

create trigger update_promotions_updated_at before
update
    on
    public.promotions for each row execute function update_updated_at_column();


-- public.services definition

-- Drop table

-- DROP TABLE public.services;

CREATE TABLE public.services (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	is_special bool DEFAULT false NOT NULL,
	special_price numeric(10, 2) NULL,
	active bool DEFAULT true NOT NULL,
	order_index int4 DEFAULT 0 NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT check_special_service CHECK ((((is_special = false) AND (special_price IS NULL)) OR ((is_special = true) AND (special_price IS NOT NULL) AND (special_price >= (0)::numeric)))),
	CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_services_active ON public.services USING btree (active);
CREATE INDEX idx_services_is_special ON public.services USING btree (is_special);
CREATE INDEX idx_services_name ON public.services USING btree (name);
CREATE INDEX idx_services_order ON public.services USING btree (order_index);

-- Table Triggers

create trigger set_service_order before
insert
    on
    public.services for each row execute function set_service_order_index();
create trigger update_services_updated_at before
update
    on
    public.services for each row execute function update_updated_at_column();


-- public.bookings definition

-- Drop table

-- DROP TABLE public.bookings;

CREATE TABLE public.bookings (
	id serial4 NOT NULL,
	customer_id int4 NOT NULL,
	booking_date date NOT NULL,
	booking_time time NOT NULL,
	note text NULL,
	deposit_amount numeric(10, 2) DEFAULT 0 NOT NULL,
	deposit_status varchar(20) DEFAULT 'NONE'::character varying NOT NULL,
	deposit_forfeited_date timestamptz NULL,
	status varchar(20) DEFAULT 'PENDING'::character varying NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT bookings_pkey PRIMARY KEY (id),
	CONSTRAINT check_booking_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[]))),
	CONSTRAINT check_deposit_amount CHECK ((deposit_amount >= (0)::numeric)),
	CONSTRAINT check_deposit_status CHECK (((deposit_status)::text = ANY ((ARRAY['NONE'::character varying, 'HELD'::character varying, 'USED'::character varying, 'FORFEITED'::character varying])::text[]))),
	CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);
CREATE INDEX idx_bookings_customer_id ON public.bookings USING btree (customer_id);
CREATE INDEX idx_bookings_datetime ON public.bookings USING btree (booking_date, booking_time);
CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);

-- Table Triggers

create trigger update_bookings_updated_at before
update
    on
    public.bookings for each row execute function update_updated_at_column();


-- public.breeds definition

-- Drop table

-- DROP TABLE public.breeds;

CREATE TABLE public.breeds (
	id serial4 NOT NULL,
	pet_type_id varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	order_index int4 NOT NULL,
	active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT breeds_pkey PRIMARY KEY (id),
	CONSTRAINT unique_breed_name_per_type UNIQUE (pet_type_id, name),
	CONSTRAINT breeds_pet_type_id_fkey FOREIGN KEY (pet_type_id) REFERENCES public.pet_type_configs(id) ON DELETE CASCADE
);
CREATE INDEX idx_breeds_active ON public.breeds USING btree (active);
CREATE INDEX idx_breeds_pet_type_id ON public.breeds USING btree (pet_type_id);

-- Table Triggers

create trigger update_breeds_updated_at before
update
    on
    public.breeds for each row execute function update_updated_at_column();


-- public.hotel_bookings definition

-- Drop table

-- DROP TABLE public.hotel_bookings;

CREATE TABLE public.hotel_bookings (
	id serial4 NOT NULL,
	customer_id int4 NOT NULL,
	check_in_date date NOT NULL,
	check_out_date date NULL,
	rate_per_night numeric(10, 2) DEFAULT 0 NOT NULL,
	deposit_amount numeric(10, 2) DEFAULT 0 NOT NULL,
	deposit_status varchar(20) DEFAULT 'NONE'::character varying NOT NULL,
	note text NULL,
	status varchar(20) DEFAULT 'RESERVED'::character varying NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT check_hotel_deposit CHECK ((deposit_amount >= (0)::numeric)),
	CONSTRAINT check_hotel_deposit_status CHECK (((deposit_status)::text = ANY ((ARRAY['NONE'::character varying, 'HELD'::character varying, 'USED'::character varying, 'FORFEITED'::character varying])::text[]))),
	CONSTRAINT check_hotel_rate CHECK ((rate_per_night >= (0)::numeric)),
	CONSTRAINT check_hotel_status CHECK (((status)::text = ANY ((ARRAY['RESERVED'::character varying, 'CHECKED_IN'::character varying, 'CHECKED_OUT'::character varying, 'CANCELLED'::character varying])::text[]))),
	CONSTRAINT hotel_bookings_pkey PRIMARY KEY (id),
	CONSTRAINT hotel_bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);
CREATE INDEX idx_hotel_bookings_check_in ON public.hotel_bookings USING btree (check_in_date);
CREATE INDEX idx_hotel_bookings_check_out ON public.hotel_bookings USING btree (check_out_date);
CREATE INDEX idx_hotel_bookings_created_at ON public.hotel_bookings USING btree (created_at DESC);
CREATE INDEX idx_hotel_bookings_customer_id ON public.hotel_bookings USING btree (customer_id);
CREATE INDEX idx_hotel_bookings_status ON public.hotel_bookings USING btree (status);

-- Table Triggers

create trigger update_hotel_bookings_updated_at before
update
    on
    public.hotel_bookings for each row execute function update_updated_at_column();


-- public.pets definition

-- Drop table

-- DROP TABLE public.pets;

CREATE TABLE public.pets (
	id serial4 NOT NULL,
	customer_id int4 NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(10) NOT NULL,
	breed varchar(255) NULL,
	breed_2 varchar(255) NULL,
	is_mixed_breed bool DEFAULT false NOT NULL,
	weight numeric(5, 2) NULL,
	note text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT check_mixed_breed CHECK ((((is_mixed_breed = false) AND (breed_2 IS NULL)) OR ((is_mixed_breed = true) AND (breed IS NOT NULL) AND (breed_2 IS NOT NULL)))),
	CONSTRAINT check_pet_type CHECK (((type)::text = ANY ((ARRAY['DOG'::character varying, 'CAT'::character varying])::text[]))),
	CONSTRAINT check_pet_weight CHECK (((weight IS NULL) OR (weight >= (0)::numeric))),
	CONSTRAINT pets_pkey PRIMARY KEY (id),
	CONSTRAINT pets_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);
CREATE INDEX idx_pets_customer_id ON public.pets USING btree (customer_id);
CREATE INDEX idx_pets_type ON public.pets USING btree (type);

-- Table Triggers

create trigger update_pets_updated_at before
update
    on
    public.pets for each row execute function update_updated_at_column();


-- public.sales definition

-- Drop table

-- DROP TABLE public.sales;

CREATE TABLE public.sales (
	id serial4 NOT NULL,
	booking_id int4 NULL,
	customer_id int4 NULL,
	sale_type varchar(20) DEFAULT 'SERVICE'::character varying NOT NULL,
	hotel_booking_id int4 NULL,
	subtotal numeric(10, 2) NOT NULL,
	discount_amount numeric(10, 2) DEFAULT 0 NULL,
	promotion_id int4 NULL,
	custom_discount numeric(10, 2) DEFAULT 0 NULL,
	deposit_used numeric(10, 2) DEFAULT 0 NULL,
	total_amount numeric(10, 2) NOT NULL,
	payment_method text NOT NULL,
	cash_received numeric(10, 2) NULL,
	"change" numeric(10, 2) NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT check_sale_type CHECK (((sale_type)::text = ANY ((ARRAY['SERVICE'::character varying, 'HOTEL'::character varying, 'PRODUCT'::character varying, 'MIXED'::character varying])::text[]))),
	CONSTRAINT check_sales_custom_discount CHECK ((custom_discount >= (0)::numeric)),
	CONSTRAINT check_sales_deposit CHECK ((deposit_used >= (0)::numeric)),
	CONSTRAINT check_sales_discount CHECK ((discount_amount >= (0)::numeric)),
	CONSTRAINT check_sales_subtotal CHECK ((subtotal >= (0)::numeric)),
	CONSTRAINT check_sales_total CHECK ((total_amount >= (0)::numeric)),
	CONSTRAINT sales_payment_method_check CHECK ((payment_method = ANY (ARRAY['CASH'::text, 'QR'::text, 'CREDIT_CARD'::text]))),
	CONSTRAINT sales_pkey PRIMARY KEY (id),
	CONSTRAINT sales_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL,
	CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL,
	CONSTRAINT sales_hotel_booking_id_fkey FOREIGN KEY (hotel_booking_id) REFERENCES public.hotel_bookings(id) ON DELETE SET NULL,
	CONSTRAINT sales_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE SET NULL
);
CREATE INDEX idx_sales_booking_id ON public.sales USING btree (booking_id);
CREATE INDEX idx_sales_created_at ON public.sales USING btree (created_at DESC);
CREATE INDEX idx_sales_customer_id ON public.sales USING btree (customer_id);
CREATE INDEX idx_sales_hotel_booking_id ON public.sales USING btree (hotel_booking_id);
CREATE INDEX idx_sales_hotel_booking_sale_type ON public.sales USING btree (hotel_booking_id, sale_type, created_at DESC);
CREATE INDEX idx_sales_payment_method ON public.sales USING btree (payment_method);
CREATE INDEX idx_sales_sale_type ON public.sales USING btree (sale_type);


-- public.sale_items definition

-- Drop table

-- DROP TABLE public.sale_items;

CREATE TABLE public.sale_items (
	id serial4 NOT NULL,
	sale_id int4 NOT NULL,
	service_id int4 NULL,
	service_name text NOT NULL,
	pet_id int4 NULL,
	item_type varchar(20) DEFAULT 'SERVICE'::character varying NOT NULL,
	quantity int4 DEFAULT 1 NOT NULL,
	unit_price numeric(10, 2) DEFAULT 0 NOT NULL,
	product_id int4 NULL,
	original_price numeric(10, 2) NOT NULL,
	final_price numeric(10, 2) NOT NULL,
	is_price_modified bool DEFAULT false NULL,
	CONSTRAINT check_item_type CHECK (((item_type)::text = ANY ((ARRAY['SERVICE'::character varying, 'HOTEL_ROOM'::character varying, 'PRODUCT'::character varying])::text[]))),
	CONSTRAINT check_quantity CHECK ((quantity >= 1)),
	CONSTRAINT check_sale_items_final_price CHECK ((final_price >= (0)::numeric)),
	CONSTRAINT check_sale_items_original_price CHECK ((original_price >= (0)::numeric)),
	CONSTRAINT sale_items_pkey PRIMARY KEY (id),
	CONSTRAINT sale_items_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE SET NULL,
	CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL,
	CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE,
	CONSTRAINT sale_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL
);
CREATE INDEX idx_sale_items_item_type ON public.sale_items USING btree (item_type);
CREATE INDEX idx_sale_items_pet_id ON public.sale_items USING btree (pet_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items USING btree (product_id);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items USING btree (sale_id);
CREATE INDEX idx_sale_items_service_id ON public.sale_items USING btree (service_id);

-- Table Triggers

create trigger trigger_decrease_product_stock after
insert
    on
    public.sale_items for each row execute function decrease_product_stock();


-- public.size_configs definition

-- Drop table

-- DROP TABLE public.size_configs;

CREATE TABLE public.size_configs (
	id varchar(50) NOT NULL,
	pet_type_id varchar(50) NOT NULL,
	"name" varchar(50) NOT NULL,
	min_weight numeric(5, 2) NULL,
	max_weight numeric(5, 2) NULL,
	description varchar(255) NULL,
	order_index int4 NOT NULL,
	active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT check_weight_range CHECK (((min_weight IS NULL) OR (max_weight IS NULL) OR (min_weight < max_weight))),
	CONSTRAINT size_configs_pkey PRIMARY KEY (id),
	CONSTRAINT size_configs_pet_type_id_fkey FOREIGN KEY (pet_type_id) REFERENCES public.pet_type_configs(id) ON DELETE CASCADE
);
CREATE INDEX idx_size_configs_active ON public.size_configs USING btree (active);
CREATE INDEX idx_size_configs_pet_type_id ON public.size_configs USING btree (pet_type_id);

-- Table Triggers

create trigger update_size_configs_updated_at before
update
    on
    public.size_configs for each row execute function update_updated_at_column();


-- public.booking_pets definition

-- Drop table

-- DROP TABLE public.booking_pets;

CREATE TABLE public.booking_pets (
	id serial4 NOT NULL,
	booking_id int4 NOT NULL,
	pet_id int4 NOT NULL,
	service_type varchar(255) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT booking_pets_pkey PRIMARY KEY (id),
	CONSTRAINT unique_booking_pet UNIQUE (booking_id, pet_id),
	CONSTRAINT booking_pets_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
	CONSTRAINT booking_pets_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE
);
CREATE INDEX idx_booking_pets_booking_id ON public.booking_pets USING btree (booking_id);
CREATE INDEX idx_booking_pets_pet_id ON public.booking_pets USING btree (pet_id);


-- public.hotel_bookings_pet definition

-- Drop table

-- DROP TABLE public.hotel_bookings_pet;

CREATE TABLE public.hotel_bookings_pet (
	id int4 DEFAULT nextval('hotel_booking_pet_id_seq'::regclass) NOT NULL,
	hotel_booking_id int4 NOT NULL,
	pet_id int4 NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT hotel_rooms_pkey PRIMARY KEY (id),
	CONSTRAINT unique_hotel_booking_pet UNIQUE (hotel_booking_id, pet_id),
	CONSTRAINT hotel_rooms_hotel_booking_id_fkey FOREIGN KEY (hotel_booking_id) REFERENCES public.hotel_bookings(id) ON DELETE CASCADE,
	CONSTRAINT hotel_rooms_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE
);
CREATE INDEX idx_hotel_rooms_booking_id ON public.hotel_bookings_pet USING btree (hotel_booking_id);
CREATE INDEX idx_hotel_rooms_pet_id ON public.hotel_bookings_pet USING btree (pet_id);


-- public.service_prices definition

-- Drop table

-- DROP TABLE public.service_prices;

CREATE TABLE public.service_prices (
	id serial4 NOT NULL,
	service_id int4 NOT NULL,
	pet_type_id varchar(50) NULL,
	size_id varchar(50) NULL,
	price numeric(10, 2) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT check_pet_type_size CHECK ((((pet_type_id IS NOT NULL) AND (size_id IS NOT NULL)) OR ((pet_type_id IS NULL) AND (size_id IS NULL)))),
	CONSTRAINT check_price CHECK ((price >= (0)::numeric)),
	CONSTRAINT service_prices_pkey PRIMARY KEY (id),
	CONSTRAINT unique_service_pet_size UNIQUE (service_id, pet_type_id, size_id),
	CONSTRAINT service_prices_pet_type_id_fkey FOREIGN KEY (pet_type_id) REFERENCES public.pet_type_configs(id) ON DELETE CASCADE,
	CONSTRAINT service_prices_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
	CONSTRAINT service_prices_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.size_configs(id) ON DELETE CASCADE
);
CREATE INDEX idx_service_prices_pet_type_size ON public.service_prices USING btree (pet_type_id, size_id);
CREATE INDEX idx_service_prices_service_id ON public.service_prices USING btree (service_id);

-- Table Triggers

create trigger update_service_prices_updated_at before
update
    on
    public.service_prices for each row execute function update_updated_at_column();