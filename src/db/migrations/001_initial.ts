  import type { Knex } from 'knex';

  export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('scrape_jobs', (table) => {
      table.uuid('id').primary().defaultTo(knex.fn.uuid());
      table.string('source', 50).notNullable();
      table.string('status', 20).notNullable().defaultTo('pending');
      table.timestamp('triggered_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('completed_at', { useTz: true }).nullable();
      table.text('error_message').nullable();
    });

    await knex.schema.createTable('books', (table) => {
      table.uuid('id').primary().defaultTo(knex.fn.uuid());
      table.string('upc', 30).unique().notNullable();
      table.text('title').notNullable();
      table.decimal('price_gbp', 8, 2);
      table.smallint('rating');
      table.string('category', 80);
      table.boolean('available');
      table.text('description').nullable();
      table.integer('num_reviews');
      table.timestamp('scraped_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('hn_stories', (table) => {
      table.uuid('id').primary().defaultTo(knex.fn.uuid());
      table.bigint('hn_item_id').unique().notNullable();
      table.text('title').notNullable();
      table.text('url').nullable();
      table.integer('score');
      table.string('author', 100);
      table.integer('comment_count');
      table.string('story_type', 20);
      table.timestamp('scraped_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('hn_stories');
    await knex.schema.dropTableIfExists('books');
    await knex.schema.dropTableIfExists('scrape_jobs');
  }
