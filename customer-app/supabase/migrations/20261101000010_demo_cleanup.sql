/* Take the sample catalogue (seed.sql: m1..m7) out of the live marketplace.

   Rows are identified by the is_demo marker set in the previous migration (id + name + no owner), never by guesswork.
   Nothing is deleted: orders, ledgers and wallets that reference these stores stay intact, and the change is reversible with
     update public.merchants set active = true, open = true where is_demo;
   Real merchants are never touched: the marker can only be true for a row that matched the sample id, name and had no owner. */
update public.merchants set active = false, open = false where is_demo and active;
