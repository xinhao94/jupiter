package com.laioffer.job.recommendation;

import com.laioffer.job.db.MySQLConnection;
import com.laioffer.job.entity.Item;
import com.laioffer.job.external.GitHubClient;

import java.util.*;

public class Recommendation {

    public List<Item> recommendItems(String userId, double lat, double lon) {
        List<Item> recommendedItems = new ArrayList<>();

        // Step 1: get all favorite item ids from database
        // based on input used id
        MySQLConnection connection = new MySQLConnection();
        Set<String> favoritedItemIds = connection.getFavoriteItemIds(userId);

        // Step 2: get all keywords for the favorite items from database
        // and sort them by occurrence count
        Map<String, Integer> allKeywords = new HashMap<>();
        for (String itemId : favoritedItemIds) {
            Set<String> keywords = connection.getKeywords(itemId);
            for (String keyword : keywords) {
                allKeywords.put(keyword, allKeywords.getOrDefault(keyword, 0)+1);
            }
        }
        connection.close();

        List<Map.Entry<String, Integer>> keywordList = new ArrayList<>(allKeywords.entrySet());
        keywordList.sort((Map.Entry<String, Integer> e1, Map.Entry<String, Integer> e2) ->
                Integer.compare(e2.getValue(), e1.getValue()));

        // Trim the list and keep only the top 3 keywords
        if (keywordList.size()>3) {
            keywordList = keywordList.subList(0, 3);
        }

        // Step 3: Search in GitHub based on trimmed keywords
        // filter out favorited items
        Set<String> visitedItemIds = new HashSet<>();
        GitHubClient client = new GitHubClient();

        for (Map.Entry<String, Integer> keyword : keywordList) {
            List<Item> items = client.search(lat, lon, keyword.getKey());

            for (Item item : items) {
                if (!favoritedItemIds.contains(item.getId()) &&
                !visitedItemIds.contains(item.getId())) {
                    recommendedItems.add(item);
                    visitedItemIds.add(item.getId());
                }
            }
        }

        return recommendedItems;
    }
}
