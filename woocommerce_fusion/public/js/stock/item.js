frappe.ui.form.on("Item", {
  refresh: function (frm) {
    // Only show WooCommerce buttons if Item has enabled WooCommerce server links
    let enabled_servers = (frm.doc.woocommerce_servers || []).filter(
      (r) => r.enabled && r.woocommerce_server,
    );
    if (!enabled_servers.length) return;

    let server_names = enabled_servers.map((r) => r.woocommerce_server);

    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "WooCommerce Server",
        filters: { name: ["in", server_names], enable_sync: 1 },
        fields: [
          "name",
          "enable_price_list_sync",
          "enable_stock_level_synchronisation",
        ],
      },
      callback: function (r) {
        if (!r.message || !r.message.length) return;

        // Always show "Sync Item" if any server has sync enabled
        frm.add_custom_button(
          __("Sync this Item with WooCommerce"),
          function () {
            frm.trigger("sync_item");
          },
          __("Actions"),
        );

        // Only show stock button if at least one server has stock sync enabled
        if (r.message.some((s) => s.enable_stock_level_synchronisation)) {
          frm.add_custom_button(
            __("Sync this Item's Stock Levels to WooCommerce"),
            function () {
              frm.trigger("sync_item_stock");
            },
            __("Actions"),
          );
        }

        // Only show price button if at least one server has price list sync enabled
        if (r.message.some((s) => s.enable_price_list_sync)) {
          frm.add_custom_button(
            __("Sync this Item's Price to WooCommerce"),
            function () {
              frm.trigger("sync_item_price");
            },
            __("Actions"),
          );
        }
      },
    });
  },

  sync_item_stock: function (frm) {
    // Sync this Item
    frappe.dom.freeze(__("Sync Item Stock with WooCommerce..."));
    frappe.call({
      method:
        "woocommerce_fusion.tasks.stock_update.update_stock_levels_on_woocommerce_site",
      args: {
        item_code: frm.doc.name,
      },
      callback: function (r) {
        frappe.dom.unfreeze();
        frappe.show_alert(
          {
            message: __(
              "Synchronised stock level to WooCommerce for enabled servers",
            ),
            indicator: "green",
          },
          5,
        );
        frm.reload_doc();
      },
      error: (r) => {
        frappe.dom.unfreeze();
        frappe.show_alert(
          {
            message: __(
              "There was an error processing the request. See Error Log.",
            ),
            indicator: "red",
          },
          5,
        );
      },
    });
  },

  sync_item_price: function (frm) {
    // Sync this Item's Price
    frappe.dom.freeze(__("Sync Item Price with WooCommerce..."));
    frappe.call({
      method: "woocommerce_fusion.tasks.sync_item_prices.run_item_price_sync",
      args: {
        item_code: frm.doc.name,
      },
      callback: function (r) {
        frappe.dom.unfreeze();
        frappe.show_alert(
          {
            message: __("Synchronised item price to WooCommerce"),
            indicator: "green",
          },
          5,
        );
        frm.reload_doc();
      },
      error: (r) => {
        frappe.dom.unfreeze();
        frappe.show_alert(
          {
            message: __(
              "There was an error processing the request. See Error Log.",
            ),
            indicator: "red",
          },
          5,
        );
      },
    });
  },

  sync_item: function (frm) {
    // Sync this Item
    frappe.dom.freeze(__("Sync Item with WooCommerce..."));
    frappe.call({
      method: "woocommerce_fusion.tasks.sync_items.run_item_sync",
      args: {
        item_code: frm.doc.name,
      },
      callback: function (r) {
        frappe.dom.unfreeze();
        frappe.show_alert(
          {
            message: __("Sync completed successfully"),
            indicator: "green",
          },
          5,
        );
        frm.reload_doc();
      },
      error: (r) => {
        frappe.dom.unfreeze();
        frappe.show_alert(
          {
            message: __(
              "There was an error processing the request. See Error Log.",
            ),
            indicator: "red",
          },
          5,
        );
      },
    });
  },
});

frappe.ui.form.on("Item WooCommerce Server", {
  view_product: function (frm, cdt, cdn) {
    let current_row_doc = locals[cdt][cdn];
    console.log(current_row_doc);
    frappe.set_route(
      "Form",
      "WooCommerce Product",
      `${current_row_doc.woocommerce_server}~${current_row_doc.woocommerce_id}`,
    );
  },
});
